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
    const [mapKey, setMapKey] = useState(Date.now());

    // Efecto para establecer la posición inicial
    useEffect(() => {
        if (latitude !== undefined && longitude !== undefined) {
            const initialPosition = {
                lat: parseFloat(latitude),
                lng: parseFloat(longitude),
            };

            if (!isNaN(initialPosition.lat) && !isNaN(initialPosition.lng)) {
                setDefaultPosition(initialPosition);
                setPath([initialPosition]); // Iniciar la ruta con la posición inicial
            }
        } else {
            const fetchLatestLocation = async () => {
                try {
                    const latestData = await latestLocation();
                    if (latestData?.[0]?.latitude !== undefined && latestData?.[0]?.longitude !== undefined) {
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
            };
            fetchLatestLocation();
        }
    }, [latitude, longitude]);

    // Efecto para actualizar la posición en tiempo real
    useEffect(() => {
        const fetchLatestLocation = async () => {
            try {
                const latestData = await latestLocation();
                if (latestData?.[0]?.latitude !== undefined && latestData?.[0]?.longitude !== undefined) {
                    const newPosition = {
                        lat: parseFloat(latestData[0].latitude),
                        lng: parseFloat(latestData[0].longitude),
                    };

                    if (!isNaN(newPosition.lat) && !isNaN(newPosition.lng)) {
                        setDefaultPosition(newPosition);
                        setPath(prevPath => [...prevPath, newPosition]); // Acumular puntos en la polilínea
                    }
                }
            } catch (error) {
                console.error("Error fetching latest location:", error);
            }
        };

        // Actualizar la ubicación cada 5 segundos en tiempo real
        const interval = setInterval(fetchLatestLocation, 5000);

        return () => clearInterval(interval);
    }, []);

    // Efecto para cargar rutas históricas basadas en fechas
    useEffect(() => {
        const fetchCoordinatesInRange = async () => {
            if (startDate && endDate) {
                try {
                    const coordinates = await rutas(startDate, endDate);
                    console.log("Coordenadas en el intervalo:", coordinates);

                    if (coordinates?.length > 0) {
                        const formattedCoordinates = coordinates.map(coord => ({
                            lat: parseFloat(coord.Latitud),
                            lng: parseFloat(coord.Longitud),
                        })).filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

                        console.log("Coordenadas formateadas:", formattedCoordinates);

                        setPath(formattedCoordinates);
                        setMapKey(Date.now()); // Forzar re-renderizado
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
