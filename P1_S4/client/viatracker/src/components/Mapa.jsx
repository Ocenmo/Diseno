import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation, rutas } from "../services/api";

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude, startDate, endDate }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    const [defaultPosition, setDefaultPosition] = useState(null);
    const [path, setPath] = useState([]);
    const [realTimePath, setRealTimePath] = useState([]); // Ruta en tiempo real

    // Efecto para establecer la posición inicial
    useEffect(() => {
        const setInitialPosition = async () => {
            if (latitude !== undefined && longitude !== undefined) {
                const initialPosition = {
                    lat: parseFloat(latitude),
                    lng: parseFloat(longitude),
                };
                if (!isNaN(initialPosition.lat) && !isNaN(initialPosition.lng)) {
                    setDefaultPosition(initialPosition);
                    setPath([initialPosition]);
                    setRealTimePath([initialPosition]); // Inicializamos ruta en tiempo real
                }
            } else {
                try {
                    const latestData = await latestLocation();
                    if (latestData?.[0]?.latitude && latestData?.[0]?.longitude) {
                        const newPosition = {
                            lat: parseFloat(latestData[0].latitude),
                            lng: parseFloat(latestData[0].longitude),
                        };
                        if (!isNaN(newPosition.lat) && !isNaN(newPosition.lng)) {
                            setDefaultPosition(newPosition);
                            setPath([newPosition]);
                            setRealTimePath([newPosition]);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching latest location:", error);
                }
            }
        };
        setInitialPosition();
    }, [latitude, longitude]);

    // Actualizar la ubicación en tiempo real cada 5 segundos
    useEffect(() => {
        const fetchLatestLocation = async () => {
            try {
                const latestData = await latestLocation();
                if (latestData?.[0]?.latitude && latestData?.[0]?.longitude) {
                    const newPosition = {
                        lat: parseFloat(latestData[0].latitude),
                        lng: parseFloat(latestData[0].longitude),
                    };

                    if (!isNaN(newPosition.lat) && !isNaN(newPosition.lng)) {
                        setRealTimePath(prevPath => [...prevPath, newPosition]); // Agregar nueva posición a la ruta en tiempo real
                    }
                }
            } catch (error) {
                console.error("Error fetching latest location:", error);
            }
        };

        const interval = setInterval(fetchLatestLocation, 5000);
        return () => clearInterval(interval);
    }, []);

    // Cargar rutas históricas según las fechas seleccionadas
    useEffect(() => {
        const fetchCoordinatesInRange = async () => {
            if (startDate && endDate) {
                try {
                    const coordinates = await rutas(startDate, endDate);
                    if (coordinates?.length > 0) {
                        const formattedCoordinates = coordinates.map(coord => ({
                            lat: parseFloat(coord.Latitud),
                            lng: parseFloat(coord.Longitud),
                        })).filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

                        setPath(formattedCoordinates);
                    } else {
                        setPath([]);
                    }
                } catch (error) {
                    console.error("Error obteniendo coordenadas:", error);
                }
            }
        };

        fetchCoordinatesInRange();
    }, [startDate, endDate]);

    if (!isLoaded) return <p>Cargando mapa...</p>;
    if (!defaultPosition) return <p>Obteniendo ubicación...</p>;

    const lastPosition = realTimePath.length > 0 ? realTimePath[realTimePath.length - 1] : defaultPosition;

    return (
        <GoogleMap
            zoom={15}
            center={lastPosition}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            {/* Última posición en tiempo real */}
            <Marker position={lastPosition} />

            {/* Polilínea en tiempo real */}
            {realTimePath.length > 1 && (
                <Polyline
                    path={realTimePath}
                    options={{
                        strokeColor: "#ff0000", // Color rojo para diferenciar la polilínea en tiempo real
                        strokeOpacity: 1,
                        strokeWeight: 2
                    }}
                />
            )}

            {/* Polilínea de historial de rutas */}
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
