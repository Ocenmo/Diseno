import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation } from "../services/api";

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    const [defaultPosition, setDefaultPosition] = useState({ lat: 0, lng: 0 });
    const [path, setPath] = useState([]);

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

    const validLat = !isNaN(latitude) && isFinite(latitude) ? latitude : defaultPosition.lat;
    const validLng = !isNaN(longitude) && isFinite(longitude) ? longitude : defaultPosition.lng;

    return (
        <GoogleMap
            zoom={15}
            center={{ lat: validLat, lng: validLng }}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            {/* Marcador de la última ubicación */}
            <Marker position={{ lat: validLat, lng: validLng }} />

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
