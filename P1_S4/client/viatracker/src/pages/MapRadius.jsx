import { GoogleMap, Marker, Polyline, Circle, useLoadScript } from "@react-google-maps/api";
import { useState, useRef, useEffect } from "react";
import { rutasCirculo } from "../services/api";

const ApiKey = import.meta.env.VITE_API_KEY;
const googleMapsLibrary = ["geometry"];

const MapWithCircle = () => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: ApiKey,
        libraries: googleMapsLibrary,
    });

    const [center, setCenter] = useState(null);
    const [radius, setRadius] = useState(0);
    const [path, setPath] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [mapKey, setMapKey] = useState(Date.now());

    const mapRef = useRef(null); // Referencia al mapa

    useEffect(() => {
        const savedCenter = localStorage.getItem("center");
        const savedRadius = localStorage.getItem("radius");
        const savedPath = localStorage.getItem("path");

        if (savedCenter) setCenter(JSON.parse(savedCenter));
        if (savedRadius) setRadius(parseFloat(savedRadius));
        if (savedPath) setPath(JSON.parse(savedPath));
    }, []);

    useEffect(() => {
        if (center && radius > 0) {
            localStorage.setItem("center", JSON.stringify(center));
            localStorage.setItem("radius", radius.toString());
            localStorage.setItem("path", JSON.stringify(path));
        }
    }, [center, radius, path]);

    const handleMouseMove = (e) => {
        if (!isDrawing || !center) return;

        const currentPos = new window.google.maps.LatLng(e.latLng.lat(), e.latLng.lng());
        const centerPos = new window.google.maps.LatLng(center.lat, center.lng);

        let newRadius = window.google.maps.geometry.spherical.computeDistanceBetween(centerPos, currentPos);
        setRadius(newRadius);
    };

    const handleClick = async (e) => {
        if (!center) {
            setCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            setRadius(0);
            setIsDrawing(true);
        } else if (isDrawing) {
            setIsDrawing(false);

            const startDate = "2025-04-01";
            const endDate = "2025-04-02";
            const data = await rutasCirculo(center.lat, center.lng, radius, startDate, endDate);

            if (data && data.length > 0) {
                setPath(data.map(coord => ({
                    lat: parseFloat(coord.Latitud),
                    lng: parseFloat(coord.Longitud),
                })));
            }
        }
    };

    const handleReset = () => {
        setCenter(null);
        setRadius(0);
        setPath([]);
        localStorage.removeItem("center");
        localStorage.removeItem("radius");
        localStorage.removeItem("path");
        setMapKey(Date.now()); // Cambiar la key para forzar el recargue
    };

    if (loadError) {
        return <p>Error al cargar el mapa</p>;
    }

    if (!isLoaded) return <p>Cargando mapa...</p>;

    return (
        <div>
            <button onClick={handleReset}>Resetear Mapa</button>
            <GoogleMap
                key={mapKey}
                zoom={15}
                center={center || { lat: 11.020082, lng: -74.850364 }}
                mapContainerStyle={{ width: "100%", height: "500px" }}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onLoad={(map) => (mapRef.current = map)}
            >
                {center && (
                    <Circle
                        center={center}
                        radius={radius}
                        options={{
                            strokeColor: "#989fce",
                            strokeOpacity: 1,
                            strokeWeight: 2,
                            fillColor: "#989fce",
                            fillOpacity: 0.25,
                            clickable: false,
                            editable: true,
                            draggable: true,
                            zIndex: 1,
                        }}
                    />
                )}

                {path.length > 0 && (
                    <Polyline
                        path={path}
                        options={{
                            strokeColor: "#2d6a4f",
                            strokeOpacity: 1,
                            strokeWeight: 2,
                        }}
                    />
                )}

                {center && <Marker position={center} />}
            </GoogleMap>
        </div>
    );
};

export default MapWithCircle;
