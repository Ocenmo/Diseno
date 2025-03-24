import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation, rutas } from "../services/api";

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude, startDate, endDate }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    const [defaultPosition, setDefaultPosition] = useState({ lat: 0, lng: 0 });
    const [path, setPath] = useState([]);

    useEffect(() => {
        console.log("Entró al useEffect de fechas en Mapa.jsx:", { startDate, endDate });
        if (!startDate || !endDate) return;

        const fetchPathByDateRange = async () => {
            try {
                console.log("Llamando API rutas con fechas:", startDate, endDate);
                const routeData = await rutas(startDate, endDate);
                console.log("Datos de rutas recibidos en Mapa.jsx:", routeData);

                if (Array.isArray(routeData) && routeData.length > 0) {
                    const formattedPath = routeData.map(item => ({
                        lat: parseFloat(item.Latitud),
                        lng: parseFloat(item.Longitud)
                    })).filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

                    if (formattedPath.length > 0) {
                        setPath(formattedPath);
                        setDefaultPosition(formattedPath[formattedPath.length - 1]); // Última coordenada
                    }
                }
            } catch (error) {
                console.error("Error fetching path by date range:", error);
            }
        };

        fetchPathByDateRange();
    }, [startDate, endDate]);

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
        if (latitude !== undefined && longitude !== undefined) {
            const newPoint = { lat: parseFloat(latitude), lng: parseFloat(longitude) };

            if (!isNaN(newPoint.lat) && !isNaN(newPoint.lng)) {
                setPath((prevPath) => [...prevPath, newPoint]);
            }
        }
    }, [latitude, longitude]);

    if (!isLoaded) return <p>Cargando mapa...</p>;

    return (
        <GoogleMap
            zoom={15}
            center={defaultPosition}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            {/* Marcador de la última ubicación */}
            <Marker position={defaultPosition} />

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
