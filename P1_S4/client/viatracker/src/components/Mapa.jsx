import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation, rutas } from "../services/api";

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude, startDate, endDate }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    const [defaultPosition, setDefaultPosition] = useState({ lat: null, lng: null });
    const [path, setPath] = useState([]);
    const [realTimePath, setRealTimePath] = useState([]);
    const [markerPosition, setMarkerPosition] = useState(null);

    useEffect(() => {
        const fetchLatestLocation = async () => {
            try {
                const latestData = await latestLocation();
                if (latestData && latestData[0]?.Latitud !== undefined && latestData[0]?.Longitud !== undefined) {
                    const initialPosition = {
                        lat: parseFloat(latestData[0].Latitud),
                        lng: parseFloat(latestData[0].Longitud),
                    };

                    if (isFinite(initialPosition.lat) && isFinite(initialPosition.lng)) {
                        setDefaultPosition(initialPosition);
                        setRealTimePath([initialPosition]);
                        setMarkerPosition(initialPosition);
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

            if (isFinite(newPoint.lat) && isFinite(newPoint.lng)) {
                setRealTimePath((prevPath) => [...prevPath, newPoint]);
                setMarkerPosition(newPoint);
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
                        })).filter(point => isFinite(point.lat) && isFinite(point.lng));

                        if (formattedPath.length > 0) {
                            setPath(formattedPath);
                            setMarkerPosition(formattedPath[formattedPath.length - 1]); // Última coordenada
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

    // Definir posición segura para el centro del mapa
    const mapCenter = markerPosition && isFinite(markerPosition.lat) && isFinite(markerPosition.lng)
        ? markerPosition
        : (defaultPosition && isFinite(defaultPosition.lat) && isFinite(defaultPosition.lng) ? defaultPosition : { lat: 0, lng: 0 });

    return (
        <GoogleMap
            zoom={15}
            center={mapCenter}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            {/* Marker en la última posición válida */}
            {markerPosition && isFinite(markerPosition.lat) && isFinite(markerPosition.lng) && (
                <Marker position={markerPosition} />
            )}

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
