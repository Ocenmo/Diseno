import React, { useState } from "react";
import DateRangeModal from "../components/DateRangeSideBar";
import { rutas } from "../services/api";

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

        const data = await rutas(formattedStartDate, formattedEndDate);

        if (data) {
            setRutasData(data);
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

            {rutasData.length > 0 && (
                <ul>
                    {rutasData.map((ruta) => (
                        <li key={ruta.id}>
                            {ruta.TimeStamp} - ({ruta.Latitud}, {ruta.Longitud})
                        </li>
                    ))}
                </ul>
            )}

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
