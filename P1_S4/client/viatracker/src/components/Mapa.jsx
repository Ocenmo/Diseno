import { GoogleMap, Polyline, useLoadScript } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";
import { latestLocation } from "../services/api";

const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
        libraries: ["marker"], // Cargar la librería de marcadores avanzados
    });

    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [defaultPosition, setDefaultPosition] = useState({ lat: 0, lng: 0 });
    const [path, setPath] = useState([]);

    useEffect(() => {
        const fetchLatestLocation = async () => {
            try {
                const latestData = await latestLocation();
                if (latestData && latestData.Latitud && latestData.Longitud) {
                    setDefaultPosition({
                        lat: latestData.Latitud,
                        lng: latestData.Longitud,
                    });
                }
            } catch (error) {
                console.error("Error fetching latest location:", error);
            }
        };
        fetchLatestLocation();
    }, []);

    useEffect(() => {
        if (isLoaded && window.google && mapRef.current) {
            if (markerRef.current) {
                markerRef.current.map = null; // Eliminar el marcador anterior
            }

            markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                position: {
                    lat: latitude ?? defaultPosition.lat,
                    lng: longitude ?? defaultPosition.lng,
                },
                map: mapRef.current,
                title: "Ubicación actual",
            });
        }
    }, [isLoaded, latitude, longitude, defaultPosition]);

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const addPointToPath = (e) => {
        try {
            const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setPath([...path, latLng]);
        } catch (error) {
            console.error("Error adding point to path:", error);
        }
    };

    return (
        <GoogleMap
            ref={mapRef}
            onClick={addPointToPath} // Mejor usar onClick en vez de onCenterChanged
            zoom={15}
            center={{ lat: latitude ?? defaultPosition.lat, lng: longitude ?? defaultPosition.lng }}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            {/* Línea de trayectoria */}
            <Polyline
                path={path}
                options={{
                    strokeColor: "#2d6a4f",
                    strokeOpacity: 1,
                    strokeWeight: 2,
                }}
            />
        </GoogleMap>
    );
};

export default Map;
