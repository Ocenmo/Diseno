import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation, rutas } from "../services/api"; // Importa rutas para obtener coordenadas en el intervalo

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude, startDate, endDate }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    const [defaultPosition, setDefaultPosition] = useState({ lat: 0, lng: 0 });
    const [path, setPath] = useState([]);

    useEffect(() => {
        if (latitude !== undefined && longitude !== undefined) {
            const initialPosition = {
                lat: parseFloat(latitude),
                lng: parseFloat(longitude),
            };

            if (!isNaN(initialPosition.lat) && !isNaN(initialPosition.lng)) {
                setDefaultPosition(initialPosition);
                setPath([initialPosition]);
            }
        } else {
            const fetchLatestLocation = async () => {
                try {
                    const latestData = await latestLocation();
                    if (latestData?.[0]?.latitude !== undefined && latestData?.[0]?.longitude !== undefined) {
                        const initialPosition = {
                            lat: parseFloat(latestData[0].latitude),
                            lng: parseFloat(latestData[0].longitude),
                        };

                        if (!isNaN(initialPosition.lat) && !isNaN(initialPosition.lng)) {
                            setDefaultPosition(initialPosition);
                            setPath([initialPosition]);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching latest location:", error);
                }
            };
            fetchLatestLocation();
        }
    }, [latitude, longitude]);

    useEffect(() => {
        const fetchCoordinatesInRange = async () => {
            if (startDate && endDate) {
                try {
                    const coordinates = await rutas(startDate, endDate);
                    console.log("Coordenadas en el intervalo:", coordinates);

                    if (coordinates?.length > 0) {
                        const formattedCoordinates = coordinates.map(coord => ({
                            lat: parseFloat(coord.latitude),
                            lng: parseFloat(coord.longitude),
                        })).filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

                        console.log("Coordenadas formateadas:", formattedCoordinates);

                        setPath([...formattedCoordinates]);
                    } else {
                        console.log("No hay coordenadas en el intervalo.");
                    }
                } catch (error) {
                    console.error("Error obteniendo coordenadas:", error);
                }
            }
        };
        fetchCoordinatesInRange();
    }, [startDate, endDate]);

    useEffect(() => {
        console.log("Path actualizado en el estado:", path);
    }, [path]);

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const lastPosition = path.length > 0 ? path[path.length - 1] : defaultPosition;

    return (
        <GoogleMap
            zoom={15}
            center={lastPosition}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            <Marker position={lastPosition} />

            {path.length > 1 ? (
                <Polyline
                    path={path}
                    options={{
                        strokeColor: "#FF0000",
                        strokeOpacity: 1,
                        strokeWeight: 4,
                    }}
                />
            ) : (
                <p>No hay suficientes puntos para la polilínea</p>
            )}
        </GoogleMap>
    );
};

export default Map;
