import React, { useState, useEffect } from "react";
import { Page, Datepicker } from "@mobiscroll/react";
import "@mobiscroll/react/dist/css/mobiscroll.min.css";
import "./DateRangeModal.css"; // Archivo CSS para estilos

const DateRangeModal = ({ isOpen, onClose, onSelectRange }) => {
    const [range, setRange] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setRange(null); // Reinicia el rango cuando se abre la modal
        }
    }, [isOpen]);

    const handleChange = (event) => {
        const { value } = event;
        if (value && value[0] && value[1]) {
            setRange(value);
        }
    };

    const handleApply = () => {
        if (range) {
            onSelectRange(new Date(range[0]), new Date(range[1]));
        }
        onClose();
    };

    if (!isOpen) return null; // No se renderiza si no está abierta

    return (
        <div className={`modal-overlay ${isOpen ? "show" : ""}`}>
            <div className="modal-content">
                <h2>Selecciona un rango de fechas</h2>
                <Page>
                    <Datepicker
                        display="anchored"
                        touchUi={true}
                        showRangeLabels={true}
                        placeholder="Selecciona un rango"
                        justifyContent="center"
                        select="range"
                        controls={["calendar", "time"]}
                        dateFormat="YYYY-MM-DD"
                        timeFormat="HH:mm"
                        returnFormat="iso8601"
                        defaultSelection={range}
                        onChange={handleChange}
                    />
                </Page>
                <div className="modal-buttons">
                    <button onClick={onClose} className="cancel">Cancelar</button>
                    <button onClick={handleApply} className="apply">Aplicar</button>
                </div>
            </div>
        </div>
    );
};

export default DateRangeModal;
