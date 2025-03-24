import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation, rutas } from "../services/api"; // Se importa 'rutas' para obtener coordenadas dentro del rango de tiempo

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude, startDate, endDate }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    const [defaultPosition, setDefaultPosition] = useState({ lat: 0, lng: 0 });
    const [path, setPath] = useState([]);
    const [useHistoricalPath, setUseHistoricalPath] = useState(false);

    useEffect(() => {
        const fetchLatestLocation = async () => {
            try {
                const latestData = await latestLocation();
                if (latestData && latestData[0]?.Latitud !== undefined && latestData[0]?.Longitud !== undefined) {
                    const initialPosition = {
                        lat: parseFloat(latestData[0].Latitud),
                        lng: parseFloat(latestData[0].Longitud),
                    };

                    if (!isNaN(initialPosition.lat) && !isNaN(initialPosition.lng)) {
                        setDefaultPosition(initialPosition);
                        setPath([initialPosition]); // Iniciar el camino con la última ubicación
                    }
                }
            } catch (error) {
                console.error("Error fetching latest location:", error);
            }
        };
        fetchLatestLocation();
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            const fetchHistoricalPath = async () => {
                try {
                    const historicalData = await rutas(startDate, endDate);
                    if (historicalData.length > 0) {
                        const newPath = historicalData.map((item) => ({
                            lat: parseFloat(item.Latitud),
                            lng: parseFloat(item.Longitud),
                        })).filter(point => !isNaN(point.lat) && !isNaN(point.lng));

                        if (newPath.length > 0) {
                            setPath(newPath);
                            setUseHistoricalPath(true);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching historical path:", error);
                }
            };
            fetchHistoricalPath();
        } else {
            setUseHistoricalPath(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (!useHistoricalPath && latitude !== undefined && longitude !== undefined) {
            const newPoint = { lat: parseFloat(latitude), lng: parseFloat(longitude) };

            if (!isNaN(newPoint.lat) && !isNaN(newPoint.lng)) {
                setPath((prevPath) => [...prevPath, newPoint]);
            }
        }
    }, [latitude, longitude, useHistoricalPath]);

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const lastPosition = path.length > 0 ? path[path.length - 1] : defaultPosition;

    return (
        <GoogleMap
            zoom={15}
            center={lastPosition}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            {/* Marcador en la última posición */}
            <Marker position={lastPosition} />

            {/* Línea de trayectoria */}
            {path.length > 1 && (
                <Polyline
                    path={path}
                    options={{
                        strokeColor: "#2d6a4f",
                        strokeOpacity: 1,
                        strokeWeight: 2
                    }}
                />
            )}
        </GoogleMap>
    );
};

export default Map;
