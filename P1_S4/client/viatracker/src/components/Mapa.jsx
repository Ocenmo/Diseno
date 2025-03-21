import { GoogleMap, AdvancedMarkerElement, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation } from "../services/api";

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude }) => {
    const { isLoaded } = useLoadScript({ googleMapsApiKey: ApiKey });
    const [defaultPosition, setDefaultPosition] = useState({ lat: 0, lng: 0 });
    const [path, setPath] = useState([]);
    const [interval, setIntervalTime] = useState(5000); // Intervalo en milisegundos (5s por defecto)

    useEffect(() => {
        const fetchLatestLocation = async () => {
            try {
                const latestData = await latestLocation();
                if (latestData && latestData.Latitud && latestData.Longitud) {
                    const newPosition = {
                        lat: latestData.Latitud,
                        lng: latestData.Longitud,
                    };
                    setDefaultPosition(newPosition);
                    setPath(prevPath => [...prevPath, newPosition]);
                }
            } catch (error) {
                console.error("Error fetching latest location:", error);
            }
        };

        fetchLatestLocation();
        const intervalId = setInterval(fetchLatestLocation, interval);
        return () => clearInterval(intervalId);
    }, [interval]);

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const validLat = typeof latitude === "number" && isFinite(latitude) ? latitude : defaultPosition.lat;
    const validLng = typeof longitude === "number" && isFinite(longitude) ? longitude : defaultPosition.lng;

    return (
        <>
            <GoogleMap
                zoom={15}
                center={{ lat: validLat, lng: validLng }}
                mapContainerStyle={{ width: "100%", height: "500px" }}
            >
                {/* Marcador en la última ubicación */}
                <AdvancedMarkerElement position={{ lat: validLat, lng: validLng }} />

                {/* Línea de trayectoria */}
                <Polyline
                    path={path}
                    options={{
                        strokeColor: "#2d6a4f",
                        strokeOpacity: 1,
                        strokeWeight: 2,
                    }}
                />
            </GoogleMap>
            <div>
                <label>Intervalo de actualización (ms): </label>
                <input
                    type="number"
                    value={interval}
                    onChange={(e) => setIntervalTime(Number(e.target.value))}
                />
            </div>
        </>
    );
};

export default Map;
