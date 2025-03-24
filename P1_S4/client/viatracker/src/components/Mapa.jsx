import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation, rutas } from "../services/api";

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude, selectedDateTime }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    const [defaultPosition, setDefaultPosition] = useState({ lat: 0, lng: 0 });
    const [livePath, setLivePath] = useState([]);
    const [historyPath, setHistoryPath] = useState([]);

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
                        setLivePath([initialPosition]); // Iniciar la ruta en tiempo real
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
                setLivePath((prevPath) => [...prevPath, newPoint]);
            }
        }
    }, [latitude, longitude]);

    useEffect(() => {
        if (selectedDateTime) {
            const fetchRoute = async () => {
                try {
                    const { inicio, fin } = selectedDateTime;
                    const routeData = await rutas(inicio, fin);
                    if (routeData.length > 0) {
                        const newPath = routeData.map(point => ({
                            lat: parseFloat(point.Latitud),
                            lng: parseFloat(point.Longitud)
                        })).filter(point => !isNaN(point.lat) && !isNaN(point.lng));

                        setHistoryPath(newPath);
                    }
                } catch (error) {
                    console.error("Error fetching route:", error);
                }
            };
            fetchRoute();
        }
    }, [selectedDateTime]);

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

            {/* Polilínea en tiempo real */}
            {livePath.length > 1 && (
                <Polyline
                    path={livePath}
                    options={{
                        strokeColor: "#2d6a4f",
                        strokeOpacity: 1,
                        strokeWeight: 2
                    }}
                />
            )}

            {/* Polilínea del historial de rutas */}
            {historyPath.length > 1 && (
                <Polyline
                    path={historyPath}
                    options={{
                        strokeColor: "#ff0000",
                        strokeOpacity: 1,
                        strokeWeight: 2
                    }}
                />
            )}
        </GoogleMap>
    );
};

export default Map;
