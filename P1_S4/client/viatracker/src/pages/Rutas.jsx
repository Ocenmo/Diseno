import React, { useState } from "react";
import DateRangeModal from "../components/DateRangeSidebar";
import Map from "../components/Mapa";
import { rutas } from "../services/api";
import "./Rutas.css";

const Rutas = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);
    const [rutasData, setRutasData] = useState([]);

    const handleSelectRange = async (startDate, endDate) => {
        setSelectedRange({ startDate, endDate });

        console.log("Fechas seleccionadas:", { startDate, endDate });

        // Formatear fechas correctamente en "YYYY-MM-DD HH:MM:SS"
        const formattedStartDate = startDate.toISOString().split("T")[0] + " 00:00:00";
        const formattedEndDate = endDate.toISOString().split("T")[0] + " 23:59:59";

        try {
            const data = await rutas(formattedStartDate, formattedEndDate);
            if (data && data.length > 0) {
                setRutasData(data);
            } else {
                setRutasData([]);
            }
        } catch (error) {
            console.error("Error obteniendo coordenadas:", error);
            setRutasData([]);
        }
    };

    return (
        <div>
            <h1>Historial de rutas</h1>
            <button
                onClick={() => {
                    console.log("Abriendo modal...");
                    setIsModalOpen(true);
                }}
            >
                Seleccionar rango
            </button>

            {selectedRange && (
                <p>Fechas seleccionadas: {selectedRange.startDate.toDateString()} - {selectedRange.endDate.toDateString()}</p>
            )}

            <Map
                latitude={rutasData.length > 0 ? parseFloat(rutasData[0].Latitud) : undefined}
                longitude={rutasData.length > 0 ? parseFloat(rutasData[0].Longitud) : undefined}
                startDate={selectedRange ? selectedRange.startDate.toISOString().split("T")[0] + " 00:00:00" : null}
                endDate={selectedRange ? selectedRange.endDate.toISOString().split("T")[0] + " 23:59:59" : null}
                historicalPath={rutasData.map(coord => ({
                    lat: parseFloat(coord.Latitud),
                    lng: parseFloat(coord.Longitud)
                })).filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng))}
                lastPosition={rutasData.length > 0 ? {
                    lat: parseFloat(rutasData[rutasData.length - 1].Latitud),
                    lng: parseFloat(rutasData[rutasData.length - 1].Longitud)
                } : undefined}
            />

            {/* Modal de selección de fechas */}
            <DateRangeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelectRange={handleSelectRange}
            />
        </div>
    );
};

export default Rutas;
