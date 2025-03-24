import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation, rutas } from "../services/api";

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude, selectedTimeRange }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    const [defaultPosition, setDefaultPosition] = useState({ lat: 0, lng: 0 });
    const [path, setPath] = useState([]);

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
                        setPath([initialPosition]);
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
                setPath((prevPath) => [...prevPath, newPoint]);
            }
        }
    }, [latitude, longitude]);

    useEffect(() => {
        const fetchRouteData = async () => {
            if (selectedTimeRange.startDate && selectedTimeRange.endDate) {
                try {
                    const routeData = await rutas(selectedTimeRange.startDate, selectedTimeRange.endDate);
                    if (Array.isArray(routeData)) {
                        const formattedPath = routeData.map((point) => ({
                            lat: parseFloat(point.latitude),
                            lng: parseFloat(point.longitude)
                        })).filter(point => !isNaN(point.lat) && !isNaN(point.lng));

                        if (formattedPath.length > 0) {
                            setPath(formattedPath);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching route data:", error);
                }
            }
        };
        fetchRouteData();
    }, [selectedTimeRange]);

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const validLat = !isNaN(latitude) && isFinite(latitude) ? latitude : defaultPosition.lat;
    const validLng = !isNaN(longitude) && isFinite(longitude) ? longitude : defaultPosition.lng;

    return (
        <GoogleMap
            zoom={15}
            center={{ lat: validLat, lng: validLng }}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            <Marker position={{ lat: validLat, lng: validLng }} />

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
