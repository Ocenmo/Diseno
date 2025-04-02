import { GoogleMap, Marker, Polyline, Circle } from "@react-google-maps/api";
import { useState, useRef, useEffect } from "react";
import { rutasCirculo } from "../services/api";
import DateRangeModal from "../components/DateRangeSidebar";
import "./Radius.css";


const MapWithCircle = () => {

    const [center, setCenter] = useState(null);
    const [radius, setRadius] = useState(0);
    const [path, setPath] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [mapKey, setMapKey] = useState(Date.now());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);
    const [noData, setNoData] = useState(false);

    const mapRef = useRef(null);

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

    const handleClick = (e) => {
        if (!center) {
            setCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            setRadius(0);
            setIsDrawing(true);
        } else if (isDrawing) {
            setIsDrawing(false);
            setIsModalOpen(true);
        }
    };

    const isCoordinateInCircle = (coordinate) => {
        if (!center || radius === 0) return false;

        const coordinateLatLng = new window.google.maps.LatLng(coordinate.Latitud, coordinate.Longitud);
        const centerLatLng = new window.google.maps.LatLng(center.lat, center.lng);

        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(centerLatLng, coordinateLatLng);
        return distance <= radius;
    };

    const handleSelectRange = async (startDate, endDate) => {
        setSelectedRange({ startDate, endDate });

        if (!center || radius === 0) return;

        const formattedStartDate = startDate.toISOString().split("T")[0] + " 00:00:00";
        const formattedEndDate = endDate.toISOString().split("T")[0] + " 23:59:59";

        console.log("📍 Radio del círculo:", radius);
        console.log("⏳ Lapso de tiempo seleccionado:", formattedStartDate, "a", formattedEndDate);

        const data = await rutasCirculo(center.lat, center.lng, radius, formattedStartDate, formattedEndDate);
        console.log("Datos recibidos de la API:", data);

        if (data && data.length > 0) {
            const filteredPath = data.filter(isCoordinateInCircle).map(coord => ({
                lat: parseFloat(coord.Latitud),
                lng: parseFloat(coord.Longitud),
            }));
            setPath(filteredPath);
            setNoData(filteredPath.length === 0);
        } else {
            setNoData(true);
        }
    };

    const handleReset = () => {
        setCenter(null);
        setRadius(0);
        setPath([]);
        setSelectedRange(null);
        setNoData(false);
        localStorage.removeItem("center");
        localStorage.removeItem("radius");
        localStorage.removeItem("path");
        setMapKey(Date.now());
    };


    return (
        <div>
            <h1>Haga click para dibujar el radio de busqueda</h1>
            <button className="Reset" onClick={handleReset}>Resetear Mapa</button>
            {selectedRange && (
                <p>Fechas seleccionadas: {selectedRange.startDate.toDateString()} - {selectedRange.endDate.toDateString()}</p>
            )}

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

            <DateRangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectRange={handleSelectRange} />

            {noData && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>No hubo movimiento en el rango seleccionado</h2>
                        <button onClick={() => setNoData(false)} className="close-button">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapWithCircle;