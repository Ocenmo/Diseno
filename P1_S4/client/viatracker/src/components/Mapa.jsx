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
    const [mapKey, setMapKey] = useState(Date.now());

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
                    setPath([initialPosition]); // Inicializamos la ruta
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
                        }
                    }
                } catch (error) {
                    console.error("Error fetching latest location:", error);
                }
            }
        };
        setInitialPosition();
    }, [latitude, longitude]);

    // Efecto para actualizar la ubicación en tiempo real
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
                        setPath(prevPath => [...prevPath, newPosition]); // Añadir a la polilínea
                        setMapKey(Date.now()); // Forzar re-render
                    }
                }
            } catch (error) {
                console.error("Error fetching latest location:", error);
            }
        };

        const interval = setInterval(fetchLatestLocation, 5000);
        return () => clearInterval(interval);
    }, []);

    // Efecto para cargar rutas históricas con fechas seleccionadas
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
                        setMapKey(Date.now()); // Forzar re-render
                    } else {
                        setPath([]);
                        setMapKey(Date.now());
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

    const lastPosition = path.length > 0 ? path[path.length - 1] : defaultPosition;

    return (
        <GoogleMap
            key={mapKey}
            zoom={15}
            center={lastPosition}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            <Marker position={lastPosition} />

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
