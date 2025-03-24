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

                    if (!isNaN(initialPosition.lat) && !isNaN(initialPosition.lng)) {
                        setDefaultPosition(initialPosition);
                        setPath([initialPosition]); // Iniciar el camino con la última ubicación
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

            if (!isNaN(newPoint.lat) && !isNaN(newPoint.lng)) {
                setPath((prevPath) => [...prevPath, newPoint]);
                setMarkerPosition(newPoint);
            }
        }
    }, [latitude, longitude]);

    // Nueva función para traer coordenadas del intervalo de tiempo
    useEffect(() => {
        const fetchPathByDateRange = async () => {
            if (!startDate || !endDate) return; // No buscar si no hay fechas seleccionadas

            try {
                const routeData = await rutas(startDate, endDate);
                console.log("Datos de rutas recibidos en Mapa.jsx:", routeData);

                if (routeData && routeData.length > 0) {
                    const formattedPath = routeData.map(item => ({
                        lat: parseFloat(item.Latitud),
                        lng: parseFloat(item.Longitud),
                    })).filter(point => !isNaN(point.lat) && !isNaN(point.lng));

                    console.log("Coordenadas procesadas en Mapa.jsx:", formattedPath);

                    if (formattedPath.length > 0) {
                        setPath(formattedPath);
                        setMarkerPosition(formattedPath[formattedPath.length - 1]); // Última coordenada

                        console.log("Nueva ruta en el mapa:", formattedPath);
                        console.log("Nueva posición del marcador:", formattedPath[formattedPath.length - 1]);
                    }
                }
            } catch (error) {
                console.error("Error al obtener las rutas:", error);
            }
        };

        fetchPathByDateRange();
    }, [startDate, endDate]);

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const validLat = markerPosition?.lat || defaultPosition.lat;
    const validLng = markerPosition?.lng || defaultPosition.lng;

    return (
        <GoogleMap
            zoom={15}
            center={{ lat: validLat, lng: validLng }}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            {/* Marcador en la última posición */}
            {markerPosition && <Marker position={markerPosition} />}

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
