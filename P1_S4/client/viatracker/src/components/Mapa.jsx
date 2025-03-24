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
    const [isTimeRangeActive, setIsTimeRangeActive] = useState(false);

    useEffect(() => {
        const fetchLatestLocation = async () => {
            try {
                const latestData = await latestLocation();
                if (latestData && latestData[0]?.latitude !== undefined && latestData[0]?.longitude !== undefined) {
                    const initialPosition = {
                        lat: parseFloat(latestData[0].latitude),
                        lng: parseFloat(latestData[0].longitude),
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
        if (latitude !== undefined && longitude !== undefined && !isTimeRangeActive) {
            const newPoint = { lat: parseFloat(latitude), lng: parseFloat(longitude) };

            if (!isNaN(newPoint.lat) && !isNaN(newPoint.lng)) {
                setPath((prevPath) => [...prevPath, newPoint]);
            }
        }
    }, [latitude, longitude, isTimeRangeActive]);

    useEffect(() => {
        const fetchRouteByTimeRange = async () => {
            if (startDate && endDate) {
                try {
                    const routeData = await rutas(startDate, endDate);
                    if (routeData.length > 0) {
                        const newPath = routeData.map(coord => ({
                            lat: parseFloat(coord.latitude),
                            lng: parseFloat(coord.longitude)
                        })).filter(point => !isNaN(point.lat) && !isNaN(point.lng));

                        if (newPath.length > 0) {
                            setPath(newPath);
                            setIsTimeRangeActive(true);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching route by time range:", error);
                }
            }
        };
        fetchRouteByTimeRange();
    }, [startDate, endDate]);

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const lastPoint = path.length > 0 ? path[path.length - 1] : defaultPosition;
    console.log("Última posición del marcador:", lastPoint);

    return (
        <GoogleMap
            zoom={15}
            center={lastPoint}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            {/* Marcador de la última ubicación */}
            <Marker position={lastPoint} />

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
