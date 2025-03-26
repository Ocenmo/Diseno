import React, { useState, useEffect } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./DateRangeModal.css"; // Archivo CSS para el estilo

const DateRangeModal = ({ isOpen, onClose, onSelectRange }) => {
    const [range, setRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection"
        }
    ]);

    // Asegura que la modal actualiza correctamente el estado cuando se abre
    useEffect(() => {
        if (isOpen) {
            setRange([
                {
                    startDate: new Date(),
                    endDate: new Date(),
                    key: "selection"
                }
            ]);
        }
    }, [isOpen]);

    const handleApply = () => {
        onSelectRange(range[0].startDate, range[0].endDate);
        onClose();
    };

    if (!isOpen) return null; // No se renderiza si no está abierta

    return (
        <div className={`modal-overlay ${isOpen ? "show" : ""}`}>
        <div className="modal-content">
            <h2>Selecciona un rango de fechas</h2>
            <DateRange className="date-range"
                ranges={range}
                onChange={(item) => setRange([item.selection])}
                showSelectionPreview={true}
                moveRangeOnFirstSelection={false}
                months={2}
                direction="horizontal"
            />
            <div className="modal-buttons">
                <button onClick={onClose} className="cancel">Cancelar</button>
                <button onClick={handleApply} className="apply">Aplicar</button>
            </div>
        </div>
        </div>);
};

export default DateRangeModal;
