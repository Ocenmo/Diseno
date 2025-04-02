import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation } from "../services/api";
import Table from "./Table";

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    const [defaultPosition, setDefaultPosition] = useState({ lat: 11.022092, lng: -74.851364 });
    const [path, setPath] = useState([]);

    useEffect(() => {
        if (latitude !== undefined && longitude !== undefined) {
            const newPosition = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
            if (!isNaN(newPosition.lat) && !isNaN(newPosition.lng)) {
                setDefaultPosition(newPosition);
                setPath((prevPath) => [...prevPath, newPosition]); // Construye la polilínea en tiempo real
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

    if (!isLoaded) return <p>Cargando mapa...</p>;

    return (
        <GoogleMap zoom={15} center={defaultPosition} mapContainerStyle={{ width: "100%", height: "500px" }}>
            <Marker position={defaultPosition} />
            {path.length > 1 && (
                <Polyline
                    path={path}
                    options={{ strokeColor: "#2d6a4f", strokeOpacity: 1, strokeWeight: 2 }}
                />
            )}
        </GoogleMap>
    );
};

export default Map;

//Funciona
