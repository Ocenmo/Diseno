import { GoogleMap, Marker, Polyline, Circle } from "@react-google-maps/api";
import { useState, useRef, useEffect } from "react";
import { rutasCirculo } from "../services/api";
import DateRangeModal from "../components/DateRangeSidebar";
import "./Radius.css";

const MapWithCircle = () => {
    const [center, setCenter] = useState(null);
    const [radius, setRadius] = useState(0);
    const [path, setPath] = useState([]);
    const [timestamps, setTimestamps] = useState([]); // Nuevo: timestamps
    const [currentIndex, setCurrentIndex] = useState(0); // Nuevo: índice del punto actual
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

        const data = await rutasCirculo(center.lat, center.lng, radius, formattedStartDate, formattedEndDate);

        if (data && data.length > 0) {
            const filteredCoordinates = data.filter(isCoordinateInCircle).map(coord => ({
                lat: parseFloat(coord.Latitud),
                lng: parseFloat(coord.Longitud),
                timestamp: coord.TimeStamp
            }));

            const formattedTimestamps = filteredCoordinates.map(({ timestamp }) =>
                timestamp ? new Date(timestamp).toLocaleString() : "Fecha no disponible"
            );

            setPath(filteredCoordinates.map(({ lat, lng }) => ({ lat, lng })));
            setTimestamps(formattedTimestamps);
            setCurrentIndex(0);
            setNoData(filteredCoordinates.length === 0);
        } else {
            setNoData(true);
        }
    };

    const handleReset = () => {
        setCenter(null);
        setRadius(0);
        setPath([]);
        setTimestamps([]);
        setSelectedRange(null);
        setNoData(false);
        setCurrentIndex(0);
        localStorage.removeItem("center");
        localStorage.removeItem("radius");
        localStorage.removeItem("path");
        setMapKey(Date.now());
    };

    return (
        <div className="flex-1 relative">
            <GoogleMap className="w-full h-full rounded-xl shadow-lg"
                options={{ disableDefaultUI: true, zoomControl: true }}
                key={mapKey}
                zoom={15}
                center={path.length > 0 ? path[currentIndex] : { lat: 11.020082, lng: -74.850364 }}
                mapContainerStyle={{ width: "100%", height: "calc(100vh - 60px)" }}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onLoad={(map) => (mapRef.current = map)}
            >

            <div className="flex items-center justify-center md:w-1/3">
            <button className="absolute top-30 right-10 z-10 px-6 py-2 bg-[#780000] text-[#ffffff] border-3 border-[#c1121f] rounded-xl shadow-md w-full md:w-auto hover:bg-[#c1121f] hover:scale-110 hover:text-[#14213d] hover:animate-wiggle transition-all duration-300 ease-in-out"
            onClick={handleReset}
            >
                Reiniciar Mapa
            </button>
            </div>
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
                            editable: false,
                            draggable: false,
                            zIndex: 1,
                        }}
                    />
                )}

                {path.length > 0 && (
                    <>
                        <Polyline
                            path={path}
                            options={{
                                strokeColor: "#2d6a4f",
                                strokeOpacity: 1,
                                strokeWeight: 2,
                            }}
                        />
                        <Marker position={path[currentIndex]} />
                    </>
                )}
            </GoogleMap>

            {/* Slider */}
            {path.length > 1 && (
            <div className="absolute w-full max-w-[90%] md:max-w-md h-fit bottom-40 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center justify-center border border-black rounded-[99px] bg-[#14213d] text-white shadow-[0_4px_8px_#081c15] px-4 py-3 overflow-hidden text-wrap break-words">
                <input
                    className="w-full mb-3 accent-yellow-400"
                    type="range"
                    min="0"
                    max={path.length - 1}
                    value={currentIndex}
                    onChange={(e) => setCurrentIndex(Number(e.target.value))}
                />
                <div className="text-center text-sm sm:text-base">
                    <p>{path[currentIndex] ? `Latitud: ${path[currentIndex].lat}` : ""}</p>
                    <p>{path[currentIndex] ? `Longitud: ${path[currentIndex].lng}` : ""}</p>
                    <p>{timestamps[currentIndex] ? `Fecha y hora: ${timestamps[currentIndex]}` : ""}</p>
                </div>
            </div>
        )}


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
