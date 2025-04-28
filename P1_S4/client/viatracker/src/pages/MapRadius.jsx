import { GoogleMap, Marker, Polyline, Circle } from "@react-google-maps/api";
import { useState, useRef, useEffect } from "react";
import { rutasCirculo } from "../services/api";
import DateRangeModal from "../components/DateRangeSidebar";
import "./Radius.css";

const MapWithCircle = () => {
    const [center, setCenter] = useState(null);
    const [radius, setRadius] = useState(0);
    const [pathCar1, setPathCar1] = useState([]);
    const [pathCar2, setPathCar2] = useState([]);
    const [timestampsCar1, setTimestampsCar1] = useState([]);
    const [timestampsCar2, setTimestampsCar2] = useState([]);
    const [currentIndexCar1, setCurrentIndexCar1] = useState(0);
    const [currentIndexCar2, setCurrentIndexCar2] = useState(0);
    const [isDrawing, setIsDrawing] = useState(false);
    const [mapKey, setMapKey] = useState(Date.now());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);
    const [noData, setNoData] = useState(false);
    const [selectedCar, setSelectedCar] = useState("both"); // Para seleccionar el vehículo

    const mapRef = useRef(null);

    useEffect(() => {
        const savedCenter = localStorage.getItem("center");
        const savedRadius = localStorage.getItem("radius");
        if (savedCenter) setCenter(JSON.parse(savedCenter));
        if (savedRadius) setRadius(parseFloat(savedRadius));
    }, []);

    useEffect(() => {
        if (center && radius > 0) {
        localStorage.setItem("center", JSON.stringify(center));
        localStorage.setItem("radius", radius.toString());
        }
    }, [center, radius]);

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

    // Función para procesar y filtrar los datos por carId
    const processData = (data, carId) => {
        if (data && data.length > 0) {
        return data
            .filter((coord) => coord.carId === carId) // Filtra por carId
            .filter(isCoordinateInCircle) // Filtra por el círculo
            .map((coord) => ({
            lat: parseFloat(coord.Latitud),
            lng: parseFloat(coord.Longitud),
            timestamp: coord.TimeStamp,
            rpm: Number(coord.rpm),
            speed: parseFloat(coord.speed),
            }));
        }
        return [];
    };

    const handleSelectRange = async (startDate, endDate) => {
        setSelectedRange({ startDate, endDate });
        if (!center || radius === 0) return;

        const formattedStartDate = startDate.toISOString().split("T")[0] + " 00:00:00";
        const formattedEndDate = endDate.toISOString().split("T")[0] + " 23:59:59";

        // Obtener todos los datos de la API
        const data = await rutasCirculo(center.lat, center.lng, radius, formattedStartDate, formattedEndDate);

        if (data && data.length > 0) {
        // Filtrar los datos para cada vehículo
        const filteredCar1 = processData(data, "car1");
        const filteredCar2 = processData(data, "car2");

        setPathCar1(filteredCar1);
        setPathCar2(filteredCar2);

        const timestampsCar1 = filteredCar1.map(({ timestamp }) =>
            timestamp ? new Date(timestamp).toLocaleString("es-CO", { timeZone: "UTC" }) : "Fecha no disponible"
        );
        const timestampsCar2 = filteredCar2.map(({ timestamp }) =>
            timestamp ? new Date(timestamp).toLocaleString("es-CO", { timeZone: "UTC" }) : "Fecha no disponible"
        );

        setTimestampsCar1(timestampsCar1);
        setTimestampsCar2(timestampsCar2);
        setCurrentIndexCar1(0);
        setCurrentIndexCar2(0);
        setNoData(filteredCar1.length === 0 && filteredCar2.length === 0);
        } else {
        setNoData(true);
        }
    };

    const handleReset = () => {
        setCenter(null);
        setRadius(0);
        setPathCar1([]);
        setPathCar2([]);
        setTimestampsCar1([]);
        setTimestampsCar2([]);
        setSelectedRange(null);
        setNoData(false);
        setCurrentIndexCar1(0);
        setCurrentIndexCar2(0);
        localStorage.removeItem("center");
        localStorage.removeItem("radius");
        setMapKey(Date.now());
    };

    return (
        <div className="flex-1 relative">
        <GoogleMap
            className="w-full h-full rounded-xl shadow-lg"
            options={{ disableDefaultUI: true, zoomControl: true }}
            key={mapKey}
            zoom={15}
            defaultCenter={{ lat: 11.020082, lng: -74.850364 }}
            center={
            selectedCar === "car1" && pathCar1.length > 0
                ? pathCar1[currentIndexCar1]
                : selectedCar === "car2" && pathCar2.length > 0
                ? pathCar2[currentIndexCar2]
                : center || { lat: 11.020082, lng: -74.850364 }
            }
            mapContainerStyle={{ width: "100%", height: "calc(100vh - 60px)" }}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onLoad={(map) => (mapRef.current = map)}
        >
            {/* Botón de reiniciar */}
            <div className="flex items-center justify-center">
            <button
                className="absolute top-10 right-10 z-10 px-6 py-2 bg-[#780000] text-[#ffffff] border-3 border-[#c1121f] rounded-xl shadow-md w-full md:w-auto hover:bg-[#c1121f] hover:scale-110 hover:text-[#14213d] hover:animate-wiggle transition-all duration-300 ease-in-out"
                onClick={handleReset}
            >
                Reiniciar Mapa
            </button>
            </div>

            {/* Selector de vehículos */}
            <div className="absolute top-20 right-10 z-10">
            <select
                value={selectedCar}
                onChange={(e) => setSelectedCar(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="car1">Carro 1</option>
                <option value="car2">Carro 2</option>
                <option value="both">Ambos</option>
            </select>
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

            {/* Polilíneas y marcadores */}
            {(selectedCar === "car1" || selectedCar === "both") && pathCar1.length > 0 && (
            <>
                <Polyline
                path={pathCar1}
                options={{
                    strokeColor: "#2d6a4f", // Verde para car1
                    strokeOpacity: 1,
                    strokeWeight: 2,
                }}
                />
                {selectedCar === "car1" && <Marker position={pathCar1[currentIndexCar1]} />}
            </>
            )}

            {(selectedCar === "car2" || selectedCar === "both") && pathCar2.length > 0 && (
            <>
                <Polyline
                path={pathCar2}
                options={{
                    strokeColor: "#b56576", // Rosa para car2
                    strokeOpacity: 1,
                    strokeWeight: 2,
                }}
                />
                {selectedCar === "car2" && <Marker position={pathCar2[currentIndexCar2]} />}
            </>
            )}

            {selectedCar === "both" && (
            <>
                {pathCar1.length > 0 && <Marker position={pathCar1[pathCar1.length - 1]} />}
                {pathCar2.length > 0 && <Marker position={pathCar2[pathCar2.length - 1]} />}
            </>
            )}
        </GoogleMap>

        {/* Tabla de datos */}
        <div className="absolute bottom-5 left-5 z-10 bg-white p-4 border border-gray-300 rounded-xl shadow-md">
            {selectedCar === "car1" && pathCar1.length > 0 && (
            <div>
                <h3 className="font-bold mb-2">Carro 1</h3>
                <p>Latitud: {pathCar1[currentIndexCar1].lat}</p>
                <p>Longitud: {pathCar1[currentIndexCar1].lng}</p>
                <p>RPM: {pathCar1[currentIndexCar1].rpm}</p>
                <p>Velocidad: {pathCar1[currentIndexCar1].speed}</p>
                <p>Fecha y hora: {timestampsCar1[currentIndexCar1]}</p>
            </div>
            )}

            {selectedCar === "car2" && pathCar2.length > 0 && (
            <div>
                <h3 className="font-bold mb-2">Carro 2</h3>
                <p>Latitud: {pathCar2[currentIndexCar2].lat}</p>
                <p>Longitud: {pathCar2[currentIndexCar2].lng}</p>
                <p>RPM: {pathCar2[currentIndexCar2].rpm}</p>
                <p>Velocidad: {pathCar2[currentIndexCar2].speed}</p>
                <p>Fecha y hora: {timestampsCar2[currentIndexCar2]}</p>
            </div>
            )}

            {selectedCar === "both" && (
            <div>
                <h3 className="font-bold mb-2">Datos de los carros</h3>
                <table className="table-auto">
                <thead>
                    <tr>
                    <th></th>
                    <th className="px-2">Carro 1</th>
                    <th className="px-2">Carro 2</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <td>Latitud</td>
                    <td className="px-2">{pathCar1.length > 0 ? pathCar1[pathCar1.length - 1].lat : "N/A"}</td>
                    <td className="px-2">{pathCar2.length > 0 ? pathCar2[pathCar2.length - 1].lat : "N/A"}</td>
                    </tr>
                    <tr>
                    <td>Longitud</td>
                    <td className="px-2">{pathCar1.length > 0 ? pathCar1[pathCar1.length - 1].lng : "N/A"}</td>
                    <td className="px-2">{pathCar2.length > 0 ? pathCar2[pathCar2.length - 1].lng : "N/A"}</td>
                    </tr>
                    <tr>
                    <td>RPM</td>
                    <td className="px-2">{pathCar1.length > 0 ? pathCar1[pathCar1.length - 1].rpm : "N/A"}</td>
                    <td className="px-2">{pathCar2.length > 0 ? pathCar2[pathCar2.length - 1].rpm : "N/A"}</td>
                    </tr>
                    <tr>
                    <td>Velocidad</td>
                    <td className="px-2">{pathCar1.length > 0 ? pathCar1[pathCar1.length - 1].speed : "N/A"}</td>
                    <td className="px-2">{pathCar2.length > 0 ? pathCar2[pathCar2.length - 1].speed : "N/A"}</td>
                    </tr>
                    <tr>
                    <td>Fecha y hora</td>
                    <td className="px-2">{timestampsCar1.length > 0 ? timestampsCar1[timestampsCar1.length - 1] : "N/A"}</td>
                    <td className="px-2">{timestampsCar2.length > 0 ? timestampsCar2[timestampsCar2.length - 1] : "N/A"}</td>
                    </tr>
                </tbody>
                </table>
            </div>
            )}
        </div>

        {/* Sliders */}
        {selectedCar === "car1" && pathCar1.length > 1 && (
            <div className="absolute w-full max-w-[90%] md:max-w-md h-fit bottom-40 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center justify-center border border-black rounded-[99px] bg-[#14213d] text-white shadow-[0_4px_8px_#081c15] px-4 py-3">
            <input
                className="w-full mb-3 accent-yellow-400"
                type="range"
                min="0"
                max={pathCar1.length - 1}
                value={currentIndexCar1}
                onChange={(e) => setCurrentIndexCar1(Number(e.target.value))}
            />
            </div>
        )}

        {selectedCar === "car2" && pathCar2.length > 1 && (
            <div className="absolute w-full max-w-[90%] md:max-w-md h-fit bottom-40 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center justify-center border border-black rounded-[99px] bg-[#14213d] text-white shadow-[0_4px_8px_#081c15] px-4 py-3">
            <input
                className="w-full mb-3 accent-yellow-400"
                type="range"
                min="0"
                max={pathCar2.length - 1}
                value={currentIndexCar2}
                onChange={(e) => setCurrentIndexCar2(Number(e.target.value))}
            />
            </div>
        )}

        <DateRangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectRange={handleSelectRange} />

        {noData && (
            <div className="modal-overlay">
            <div className="modal-content">
                <h2>No hubo movimiento en el rango seleccionado</h2>
                <button onClick={() => setNoData(false)} className="close-button">
                Cerrar
                </button>
            </div>
            </div>
        )}
        </div>
    );
    };

export default MapWithCircle;