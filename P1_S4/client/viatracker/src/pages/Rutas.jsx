import React, { useState } from "react";
import DateRangeModal from "../components/DateRangeSidebar";
import Map from "../components/Mapa";
import { rutas } from "../services/api";
import "./Rutas.css";

const Rutas = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);
    const [path, setPath] = useState([]);
    const [markerPosition, setMarkerPosition] = useState(null);

    const handleSelectRange = async (startDate, endDate) => {
        setSelectedRange({ startDate, endDate });

        console.log("Fechas seleccionadas:", { startDate, endDate });

        // Formatear fechas correctamente en "YYYY-MM-DD HH:MM:SS"
        const formattedStartDate = startDate.toISOString().split("T")[0] + " 00:00:00";
        const formattedEndDate = endDate.toISOString().split("T")[0] + " 23:59:59";

        try {
            const data = await rutas(formattedStartDate, formattedEndDate);
            if (data.length > 0) {
                const formattedCoordinates = data.map(coord => ({
                    lat: parseFloat(coord.Latitud),
                    lng: parseFloat(coord.Longitud)
                })).filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

                setPath(formattedCoordinates);
                setMarkerPosition(formattedCoordinates[formattedCoordinates.length - 1]); // Última posición
            } else {
                setPath([]);
                setMarkerPosition(null);
            }
        } catch (error) {
            console.error("Error obteniendo coordenadas:", error);
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
                path={path} // Enviar la ruta seleccionada
                markerPosition={markerPosition} // Última ubicación en el rango seleccionado
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
