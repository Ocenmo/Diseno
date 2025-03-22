import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TimePicker from "react-time-picker";
import { rangoFechas } from "../services/api";

const DateTimeSelector = ({ onDateTimeSelect }) => {
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState("12:00");

    useEffect(() => {
        const fetchAvailableDates = async () => {
            try {
                const availableDates = await rangoFechas();
                if (!availableDates || !availableDates.inicio || !availableDates.fin) {
                    console.error("Datos de rango de fechas inválidos:", availableDates);
                    return;
                }

                const startDate = new Date(availableDates.inicio);
                const endDate = new Date(availableDates.fin);

                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    console.error("Las fechas no son válidas:", availableDates);
                    return;
                }

                let dates = [];
                let currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    dates.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                setAvailableDates(dates);
            } catch (error) {
                console.error("Error al obtener el rango de fechas:", error);
            }
        };
        fetchAvailableDates();
    }, []);

    const isDateAvailable = (date) => {
        return availableDates.some((d) => d.toDateString() === date.toDateString());
    };

    const handleConfirm = () => {
        if (!selectedDate) {
            console.error("No se ha seleccionado una fecha.");
            return;
        }
        onDateTimeSelect(selectedDate, selectedTime);
    };

    return (
        <div>
            <h2>Selecciona una fecha y una hora</h2>
            <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                filterDate={isDateAvailable}
                inline
            />
            <TimePicker onChange={setSelectedTime} value={selectedTime} disableClock={true} />
            <button onClick={handleConfirm} disabled={!selectedDate}>
                Confirmar
            </button>
        </div>
    );
};

export default DateTimeSelector;
