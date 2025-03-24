import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation } from "../services/api";

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude, filteredData }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    const [defaultPosition, setDefaultPosition] = useState({ lat: 0, lng: 0 });
    const [path, setPath] = useState([]);
    const [isFiltered, setIsFiltered] = useState(false);

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
        if (filteredData && filteredData.length > 0) {
            const newPath = filteredData.map((point) => ({
                lat: parseFloat(point.Latitud),
                lng: parseFloat(point.Longitud)
            })).filter(point => !isNaN(point.lat) && !isNaN(point.lng));

            if (newPath.length > 0) {
                setPath(newPath);
                setIsFiltered(true);
            }
        } else {
            setIsFiltered(false);
        }
    }, [filteredData]);

    useEffect(() => {
        if (!isFiltered && latitude !== undefined && longitude !== undefined) {
            const newPoint = { lat: parseFloat(latitude), lng: parseFloat(longitude) };

            if (!isNaN(newPoint.lat) && !isNaN(newPoint.lng)) {
                setPath((prevPath) => [...prevPath, newPoint]);
            }
        }
    }, [latitude, longitude, isFiltered]);

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const lastPosition = path.length > 0 ? path[path.length - 1] : defaultPosition;

    return (
        <GoogleMap
            zoom={15}
            center={lastPosition}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            {/* Marcador de la última ubicación */}
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
