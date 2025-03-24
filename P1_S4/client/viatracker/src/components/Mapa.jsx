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
    const [realTimePath, setRealTimePath] = useState([]);

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
                        setRealTimePath([initialPosition]);
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
                setRealTimePath((prevPath) => [...prevPath, newPoint]);
            }
        }
    }, [latitude, longitude]);

    useEffect(() => {
        const fetchPathByDateRange = async () => {
            if (startDate && endDate) {
                try {
                    const routeData = await rutas(startDate, endDate);
                    if (routeData.length > 0) {
                        const formattedPath = routeData.map(coord => ({
                            lat: parseFloat(coord.Latitud),
                            lng: parseFloat(coord.Longitud),
                        })).filter(point => !isNaN(point.lat) && !isNaN(point.lng));

                        if (formattedPath.length > 0) {
                            setPath(formattedPath);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching path data:", error);
                }
            }
        };
        fetchPathByDateRange();
    }, [startDate, endDate]);

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const validLat = !isNaN(latitude) && isFinite(latitude) ? latitude : defaultPosition.lat;
    const validLng = !isNaN(longitude) && isFinite(longitude) ? longitude : defaultPosition.lng;

    return (
        <GoogleMap
            zoom={15}
            center={{ lat: validLat, lng: validLng }}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            {/* Marker en la última posición */}
            <Marker position={path.length > 0 ? path[path.length - 1] : { lat: validLat, lng: validLng }} />

            {/* Polilínea en tiempo real */}
            {path.length === 0 && realTimePath.length > 1 && (
                <Polyline
                    path={realTimePath}
                    options={{
                        strokeColor: "#2d6a4f",
                        strokeOpacity: 1,
                        strokeWeight: 2
                    }}
                />
            )}

            {/* Polilínea en el intervalo de tiempo seleccionado */}
            {path.length > 1 && (
                <Polyline
                    path={path}
                    options={{
                        strokeColor: "#ff5733",
                        strokeOpacity: 1,
                        strokeWeight: 3
                    }}
                />
            )}
        </GoogleMap>
    );
};

export default Map;
