import React, { useState } from "react";
import DateRangeModal from "../components/DateRangeSidebar";
import Map from "../components/Mapa";
import { rutas } from "../services/api";
import "./Rutas.css";

const Rutas = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);
    const [rutasData, setRutasData] = useState([]); // Guarda las rutas obtenidas por fecha

    const handleSelectRange = async (startDate, endDate) => {
        setSelectedRange({ startDate, endDate });

        console.log("Fechas seleccionadas:", { startDate, endDate });

        const formattedStartDate = startDate.toISOString().split("T")[0] + " 00:00:00";
        const formattedEndDate = endDate.toISOString().split("T")[0] + " 23:59:59";

        try {
            const data = await rutas(formattedStartDate, formattedEndDate);
            if (data && data.length > 0) {
                setRutasData(data);
            } else {
                setRutasData([]); // Si no hay datos, limpiar la ruta histórica
            }
        } catch (error) {
            console.error("Error obteniendo rutas:", error);
        }
    };

    return (
        <div>
            <h1>Historial de rutas</h1>
            <button className="buttonCalendario"
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

            {/* Pasamos rutasData directamente en lugar de startDate y endDate */}
            <Map
                latitude={rutasData.length > 0 ? parseFloat(rutasData[0].Latitud) : undefined}
                longitude={rutasData.length > 0 ? parseFloat(rutasData[0].Longitud) : undefined}
                historicalData={rutasData} // Nuevo prop con la ruta histórica
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
