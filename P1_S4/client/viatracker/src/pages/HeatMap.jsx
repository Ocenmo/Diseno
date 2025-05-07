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
    const [heatmapType, setHeatmapType] = useState("frequency"); // "frequency" o "speed"
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
                    .filter((coord) => !isNaN(coord.lat) && !isNaN(coord.lng));
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
                const maxSpeed = Math.max(...pointsToUse.map((point) => point.speed || 0));
                heatmapData = pointsToUse.map((point) => ({
                    location: new google.maps.LatLng(point.lat, point.lng),
                    weight: maxSpeed > 0 ? point.speed / maxSpeed : 0,
                }));
            }

            const newHeatmapLayer = new google.maps.visualization.HeatmapLayer({
                data: heatmapData,
                map: map,
                radius: 20,
                opacity: 0.7,
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
        <div className="flex-1 relative">
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
                mapContainerStyle={{ width: "100%", height: "calc(100vh - 60px)" }}
                onLoad={onLoad}
            >
                <div className="flex items-center justify-center">
                    <button
                        className="absolute top-10 right-10 z-10 px-6 py-2 bg-[#1d3557] text-[#ffffff] border-3 border-[#a8dadc] rounded-xl shadow-md w-full md:w-auto hover:bg-[#a8dadc] hover:scale-110 transition-all duration-300 ease-in-out"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Seleccionar
                    </button>
                </div>

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

                <div className="absolute top-32 right-10 z-10">
                    <select
                        value={heatmapType}
                        onChange={(e) => setHeatmapType(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="frequency">Frecuencia</option>
                        <option value="speed">Velocidad</option>
                    </select>
                </div>

                {selectedCar === "car1" && pathCar1.length > 0 && (
                    <Marker position={pathCar1[currentIndexCar1]} icon={iconCar1} />
                )}
                {selectedCar === "car2" && pathCar2.length > 0 && (
                    <Marker position={pathCar2[currentIndexCar2]} icon={iconCar2} />
                )}
                {selectedCar === "both" && (
                    <>
                        {pathCar1.length > 0 && <Marker position={pathCar1[pathCar1.length - 1]} icon={iconCar1} />}
                        {pathCar2.length > 0 && <Marker position={pathCar2[pathCar2.length - 1]} icon={iconCar2} />}
                    </>
                )}
            </GoogleMap>

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
                        <button onClick={() => setNoData(false)} className="close-button">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeatMap;