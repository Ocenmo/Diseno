import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation } from "../services/api";

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude, path }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    const [defaultPosition, setDefaultPosition] = useState({ lat: 0, lng: 0 });

    useEffect(() => {
        const fetchLatestLocation = async () => {
            try {
                const latestData = await latestLocation();
                if (latestData && latestData.Latitud && latestData.Longitud) {
                    setDefaultPosition({
                        lat: latestData.Latitud,
                        lng: latestData.Longitud,
                    });
                }
            } catch (error) {
                console.error("Error fetching latest location:", error);
            }
        };
        fetchLatestLocation();
    }, []);

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const validLat = typeof latitude === "number" && isFinite(latitude) ? latitude : defaultPosition.lat;
    const validLng = typeof longitude === "number" && isFinite(longitude) ? longitude : defaultPosition.lng;

    return (
        <GoogleMap
            zoom={15} // Ajusta el zoom para ver bien la ubicación
            center={{ lat: validLat, lng: validLng }}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            {/* Marcador en la última ubicación */}
            <Marker position={{ lat: validLat, lng: validLng }} />

            {/* Línea del recorrido */}
            {path.length > 1 && (
                <Polyline
                    path={path.map((coord) => ({ lat: coord[0], lng: coord[1] }))}
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
