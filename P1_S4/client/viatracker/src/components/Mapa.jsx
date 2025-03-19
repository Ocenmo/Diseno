import { useState, useEffect } from "react";
import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { latestLocation } from "../services/api";

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = () => {
    const { isLoaded } = useLoadScript({ googleMapsApiKey: ApiKey });
    const [location, setLocation] = useState({ lat: 0, lng: 0 });
    const [path, setPath] = useState([]);

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const latestData = await latestLocation();
                if (latestData && latestData.Latitud && latestData.Longitud) {
                    const newLocation = { lat: latestData.Latitud, lng: latestData.Longitud };
                    setLocation(newLocation);
                    setPath(prevPath => [...prevPath, newLocation]);
                }
            } catch (error) {
                console.error("Error obteniendo la ubicación:", error);
            }
        };

        // Llama a fetchLocation cada 5 segundos para actualizar la ubicación
        const interval = setInterval(fetchLocation, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!isLoaded) return <p>Cargando mapa...</p>;

    return (
        <GoogleMap
            zoom={15}
            center={location}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            {/* Marcador en la última ubicación */}
            <Marker position={location} />

            {/* Línea del recorrido */}
            {path.length > 1 && (
                <Polyline
                    path={path}
                    options={{
                        strokeColor: "#FF0000",
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                    }}
                />
            )}
        </GoogleMap>
    );
};

export default Map;
