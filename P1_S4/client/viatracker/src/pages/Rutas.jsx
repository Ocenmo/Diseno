import React, { useState } from "react";
import DateRangeModal from "../components/DateRangeSidebar";
import { GoogleMap, Polyline, Marker } from "@react-google-maps/api";
import { rutas } from "../services/api";
import "./Rutas.css";


const Rutas = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);
    const [path, setPath] = useState([]);
    const [timestamps, setTimestamps] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mapKey, setMapKey] = useState(Date.now());
    const [noData, setNoData] = useState(false); // Estado para indicar si no hay datos

    const handleSelectRange = async (startDate, endDate) => {
        setSelectedRange({ startDate, endDate });

        const formattedStartDate = startDate.toISOString().split("T")[0] + " 00:00:00";
        const formattedEndDate = endDate.toISOString().split("T")[0] + " 23:59:59";

        const data = await rutas(formattedStartDate, formattedEndDate);

        if (data && data.length > 0) {
            setNoData(false); // Resetear si hay datos
            console.log("Datos recibidos de la API:", data);
            const formattedCoordinates = data.map(coord => ({
                lat: parseFloat(coord.Latitud),
                lng: parseFloat(coord.Longitud),
                timestamp: coord.TimeStamp
            }))
                .filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

            const formattedTimestamps = formattedCoordinates.map(({ timestamp }) =>
                timestamp ? new Date(timestamp).toLocaleString() : "Fecha no disponible"
            );
            setTimestamps(formattedTimestamps);

            setPath(formattedCoordinates.map(({ lat, lng }) => ({ lat, lng })));
            setCurrentIndex(0);
            setMapKey(Date.now()); // Forzar re-renderizado del mapa
        } else {
            setNoData(true); // Indicar que no hay datos
        }
    };

    return (
        <div className="flex-1 relative">
            <GoogleMap className="w-full h-full rounded-xl shadow-lg"
                options={{ disableDefaultUI: true, zoomControl: true }}
                key={mapKey}
                zoom={15}
                center={path.length > 0 ? path[currentIndex] : { lat: 11.020082, lng: -74.850364 }}
                onCenterChanged={() => {
                    if (path.length > 0) {
                        const center = path[currentIndex];
                        setPath([center]);
                    }
                }}
                mapContainerStyle={{ width: "100%", height: "calc(100vh - 60px)" }}
            >
                <div className="flex items-center justify-center md:w-1/3">
                <button className="absolute top-30 right-10 z-10 px-6 py-2 bg-[#1d3557] text-[#ffffff] border-3 border-[#a8dadc] rounded-xl shadow-md w-full md:w-auto hover:bg-[#a8dadc] hover:scale-110 transition-all duration-300 ease-in-out" onClick={() => setIsModalOpen(true)}>
                    Seleccionar
                </button>
                </div>
                {path.length > 1 && (
                    <Polyline
                        path={path}
                        options={{ strokeColor: "#ff5733", strokeOpacity: 1, strokeWeight: 2 }}
                    />
                )}

                {path.length > 0 && (
                    <Marker position={path[currentIndex]} />
                )}
            </GoogleMap>

            {path.length > 1 && (
                <div className="flex-1 relative">
                <div className="resize absolute w-full max-w-[90%] md:max-w-md h-fit bottom-20 sm:bottom-24 md:bottom-32 lg:bottom-40 scale-90 sm:scale-95 md:scale-100 text-sx sm:text-sm md:text-base left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center justify-center border border-black rounded-[99px] bg-[#14213d] text-white shadow-[0_4px_8px_#081c15] px-4 py-3 overflow-hidden text-wrap break-words">
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
                </div>
            )}

            <DateRangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectRange={handleSelectRange} />

            {/* Modal de No Data */}
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

export default Rutas;
