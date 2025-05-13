import React, { useState, useEffect, useCallback } from "react";
import DateRangeModal from "../components/DateRangeSidebar";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { rutas } from "../services/api";

const HeatMap = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);
    const [pathCar1, setPathCar1] = useState([]);
    const [pathCar2, setPathCar2] = useState([]);
    const [timestampsCar1, setTimestampsCar1] = useState([]);
    const [timestampsCar2, setTimestampsCar2] = useState([]);
    const [currentIndexCar1, setCurrentIndexCar1] = useState(0);
    const [currentIndexCar2, setCurrentIndexCar2] = useState(0);
    const [mapKey, setMapKey] = useState(Date.now());
    const [noData, setNoData] = useState(false);
    const [selectedCar, setSelectedCar] = useState("both");
    const [heatmapType, setHeatmapType] = useState("frequency");
    const [heatmapLayer, setHeatmapLayer] = useState(null);
    const [map, setMap] = useState(null);

    const iconCar1 = {
        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    };

    const iconCar2 = {
        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    };

    const onLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
    }, []);

    const handleSelectRange = async (startDate, endDate) => {
        setSelectedRange({ startDate, endDate });

        const formattedStartDate = startDate.toISOString().split("T")[0] + " 00:00:00";
        const formattedEndDate = endDate.toISOString().split("T")[0] + " 23:59:59";

        const data = await rutas(formattedStartDate, formattedEndDate);

        if (data && data.length > 0) {
            setNoData(false);
            console.log("Datos recibidos de la API:", data);

            const processData = (carId) => {
                return data
                    .filter((coord) => coord.carId === carId)
                    .map((coord) => ({
                        lat: parseFloat(coord.Latitud),
                        lng: parseFloat(coord.Longitud),
                        timestamp: coord.TimeStamp,
                        rpm: Number(coord.rpm) || 0,
                        speed: parseFloat(coord.speed) || 0,
                    }))
                    .filter((coord) => !isNaN(coord.lat) && !isNaN(coord.lng))
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            };

            const filteredCar1 = processData("car1");
            const filteredCar2 = processData("car2");

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
            setMapKey(Date.now());
        } else {
            setNoData(true);
        }
    };

    useEffect(() => {
        if (map && (pathCar1.length > 0 || pathCar2.length > 0)) {
            if (heatmapLayer) {
                heatmapLayer.setMap(null);
            }

            let heatmapData = [];
            let pointsToUse = [];

            if (selectedCar === "car1") {
                pointsToUse = pathCar1.slice(0, currentIndexCar1 + 1);
            } else if (selectedCar === "car2") {
                pointsToUse = pathCar2.slice(0, currentIndexCar2 + 1);
            } else {
                pointsToUse = [
                    ...pathCar1.slice(0, currentIndexCar1 + 1),
                    ...pathCar2.slice(0, currentIndexCar2 + 1),
                ];
            }

            if (heatmapType === "frequency") {
                heatmapData = pointsToUse.map(
                    (point) => new google.maps.LatLng(point.lat, point.lng)
                );
            } else if (heatmapType === "speed") {
                // Filtrar puntos con velocidad mayor a 0
                const movingPoints = pointsToUse.filter((point) => point.speed > 0);
                if (movingPoints.length > 0) {
                    const maxSpeed = Math.max(...movingPoints.map((point) => point.speed));
                    heatmapData = movingPoints.map((point) => {
                        // Calcular el peso usando una función no lineal (elevado al cuadrado)
                        const normalizedSpeed = point.speed / maxSpeed;
                        const weight = Math.pow(normalizedSpeed, 2);
                        return {
                            location: new google.maps.LatLng(point.lat, point.lng),
                            weight: weight,
                        };
                    });
                } else {
                    heatmapData = [];
                }
            }

            const newHeatmapLayer = new google.maps.visualization.HeatmapLayer({
                data: heatmapData,
                map: map,
                radius: 25,
                opacity: 0.7,
                gradient: [
                    'rgba(0, 255, 255, 0)',
                    'rgba(0, 255, 255, 1)',
                    'rgba(0, 191, 255, 1)',
                    'rgba(0, 127, 255, 1)',
                    'rgba(0, 63, 255, 1)',
                    'rgba(0, 0, 255, 1)',
                    'rgba(0, 0, 223, 1)',
                    'rgba(0, 0, 191, 1)',
                    'rgba(0, 0, 159, 1)',
                    'rgba(0, 0, 127, 1)',
                    'rgba(63, 0, 91, 1)',
                    'rgba(127, 0, 63, 1)',
                    'rgba(191, 0, 31, 1)',
                    'rgba(255, 0, 0, 1)'
                ]
            });

            setHeatmapLayer(newHeatmapLayer);
        }
    }, [
        map,
        selectedCar,
        heatmapType,
        currentIndexCar1,
        currentIndexCar2,
        pathCar1,
        pathCar2,
    ]);

    return (
        <div className="relative flex-1 h-screen">
            <GoogleMap
                className="w-full h-full rounded-xl shadow-lg"
                options={{ disableDefaultUI: true, zoomControl: true }}
                key={mapKey}
                zoom={15}
                center={
                    selectedCar === "car1" && pathCar1.length > 0
                        ? pathCar1[currentIndexCar1]
                        : selectedCar === "car2" && pathCar2.length > 0
                        ? pathCar2[currentIndexCar2]
                        : { lat: 11.020082, lng: -74.850364 }
                }
                mapContainerStyle={{ width: "100%", height: "100%" }}
                onLoad={onLoad}
            >
                {/* Select Range Button */}
                <div className="absolute top-12 right-4 z-10 sm:top-14 sm:right-6">
                    <button
                        className="px-4 py-2 bg-[#1d3557] text-white border-2 border-[#a8dadc] rounded-xl shadow-md hover:bg-[#a8dadc] hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Seleccionar rango de Fechas
                    </button>
                </div>

                {/* Car Selection Dropdown */}
                <div className="absolute top-24 right-4 z-10 sm:top-28 sm:right-6">
                    <select
                        value={selectedCar}
                        onChange={(e) => setSelectedCar(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base w-32 sm:w-40"
                    >
                        <option value="car1">Carro 1</option>
                        <option value="car2">Carro 2</option>
                        <option value="both">Ambos</option>
                    </select>
                </div>

                {/* Heatmap Type Dropdown */}
                <div className="absolute top-36 right-4 z-10 sm:top-44 sm:right-6">
                    <select
                        value={heatmapType}
                        onChange={(e) => setHeatmapType(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base w-32 sm:w-40"
                    >
                        <option value="frequency">Frecuencia</option>
                        <option value="speed">Velocidad</option>
                    </select>
                </div>

                {/* Markers */}
                {selectedCar === "car1" && pathCar1.length > 0 && (
                    <Marker position={pathCar1[currentIndexCar1]} icon={iconCar1} />
                )}
                {selectedCar === "car2" && pathCar2.length > 0 && (
                    <Marker position={pathCar2[currentIndexCar2]} icon={iconCar2} />
                )}
                {selectedCar === "both" && (
                    <>
                        {pathCar1.length > 0 && <Marker position={pathCar1[currentIndexCar1]} icon={iconCar1} />}
                        {pathCar2.length > 0 && <Marker position={pathCar2[currentIndexCar2]} icon={iconCar2} />}
                    </>
                )}
            </GoogleMap>

            {/* Data Display */}
            <div className="absolute bottom-16 left-4 z-10 bg-white p-4 border border-gray-300 rounded-xl shadow-md max-w-[90%] sm:max-w-md max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
                {selectedCar === "car1" && pathCar1.length > 0 && (
                    <div>
                        <h3 className="font-bold mb-2 text-sm sm:text-base">Carro 1</h3>
                        <p className="text-xs sm:text-sm">Latitud: {pathCar1[currentIndexCar1].lat}</p>
                        <p className="text-xs sm:text-sm">Longitud: {pathCar1[currentIndexCar1].lng}</p>
                        <p className="text-xs sm:text-sm">RPM: {pathCar1[currentIndexCar1].rpm}</p>
                        <p className="text-xs sm:text-sm">Velocidad: {pathCar1[currentIndexCar1].speed} km/h</p>
                        <p className="text-xs sm:text-sm">Fecha y hora: {timestampsCar1[currentIndexCar1]}</p>
                    </div>
                )}

                {selectedCar === "car2" && pathCar2.length > 0 && (
                    <div>
                        <h3 className="font-bold mb-2 text-sm sm:text-base">Carro 2</h3>
                        <p className="text-xs sm:text-sm">Latitud: {pathCar2[currentIndexCar2].lat}</p>
                        <p className="text-xs sm:text-sm">Longitud: {pathCar2[currentIndexCar2].lng}</p>
                        <p className="text-xs sm:text-sm">RPM: {pathCar2[currentIndexCar2].rpm}</p>
                        <p className="text-xs sm:text-sm">Velocidad: {pathCar2[currentIndexCar2].speed} km/h</p>
                        <p className="text-xs sm:text-sm">Fecha y hora: {timestampsCar2[currentIndexCar2]}</p>
                    </div>
                )}

                {selectedCar === "both" && (
                    <div>
                        <h3 className="font-bold mb-2 text-sm sm:text-base">Datos de los carros</h3>
                        <table className="table-auto text-xs sm:text-sm w-full">
                            <thead>
                                <tr>
                                    <th className="px-2"></th>
                                    <th className="px-2">Carro 1</th>
                                    <th className="px-2">Carro 2</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-2">Latitud</td>
                                    <td className="px-2">{pathCar1.length > 0 ? pathCar1[currentIndexCar1].lat : "N/A"}</td>
                                    <td className="px-2">{pathCar2.length > 0 ? pathCar2[currentIndexCar2].lat : "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="px-2">Longitud</td>
                                    <td className="px-2">{pathCar1.length > 0 ? pathCar1[currentIndexCar1].lng : "N/A"}</td>
                                    <td className="px-2">{pathCar2.length > 0 ? pathCar2[currentIndexCar2].lng : "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="px-2">RPM</td>
                                    <td className="px-2">{pathCar1.length > 0 ? pathCar1[currentIndexCar1].rpm : "N/A"}</td>
                                    <td className="px-2">{pathCar2.length > 0 ? pathCar2[currentIndexCar2].rpm : "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="px-2">Velocidad</td>
                                    <td className="px-2">{pathCar1.length > 0 ? `${pathCar1[currentIndexCar1].speed} km/h` : "N/A"}</td>
                                    <td className="px-2">{pathCar2.length > 0 ? `${pathCar2[currentIndexCar2].speed} km/h` : "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="px-2">Fecha y hora</td>
                                    <td className="px-2">{timestampsCar1.length > 0 ? timestampsCar1[currentIndexCar1] : "N/A"}</td>
                                    <td className="px-2">{timestampsCar2.length > 0 ? timestampsCar2[currentIndexCar2] : "N/A"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Slider for Car 1 */}
            {selectedCar === "car1" && pathCar1.length > 1 && (
                <div className="absolute w-full max-w-[90%] sm:max-w-md bottom-20 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center bg-[#14213d] text-white border border-black rounded-full shadow-lg px-4 py-3">
                    <input
                        className="w-full accent-yellow-400"
                        type="range"
                        min="0"
                        max={pathCar1.length - 1}
                        value={currentIndexCar1}
                        onChange={(e) => setCurrentIndexCar1(Number(e.target.value))}
                    />
                </div>
            )}

            {/* Slider for Car 2 */}
            {selectedCar === "car2" && pathCar2.length > 1 && (
                <div className="absolute w-full max-w-[90%] sm:max-w-md bottom-20 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center bg-[#14213d] text-white border border-black rounded-full shadow-lg px-4 py-3">
                    <input
                        className="w-full accent-yellow-400"
                        type="range"
                        min="0"
                        max={pathCar2.length - 1}
                        value={currentIndexCar2}
                        onChange={(e) => setCurrentIndexCar2(Number(e.target.value))}
                    />
                </div>
            )}

            {/* Date Range Modal */}
            <DateRangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectRange={handleSelectRange} />

            {/* No Data Modal */}
            {noData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
                        <h2 className="text-lg font-bold mb-4">No hubo movimiento en el rango seleccionado</h2>
                        <button
                            onClick={() => setNoData(false)}
                            className="px-4 py-2 bg-[#1d3557] text-white rounded-xl hover:bg-[#a8dadc] transition-all duration-300"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeatMap;