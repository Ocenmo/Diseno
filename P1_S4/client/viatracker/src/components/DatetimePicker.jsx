import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TimePicker from 'react-time-picker';
import { rangoFechas } from '../services/api';

const DateTimeSelector = ({ onDateTimeSelect }) => {
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState('12:00');

    useEffect(() => {
        const fetchAvailableDates = async () => {
            try {
                const { inicio, fin } = await rangoFechas();

                // Convertimos las fechas a UTC para evitar problemas con zonas horarias
                const startDate = new Date(inicio);
                const endDate = new Date(fin);
                const dates = [];

                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    dates.push(new Date(d)); // Guardamos la fecha en la lista
                }

                setAvailableDates(dates);
            } catch (error) {
                console.error('Error al obtener el rango de fechas:', error);
            }
        };

        fetchAvailableDates();
    }, []);

    // Función para verificar si una fecha está disponible
    const isDateAvailable = date => {
        return availableDates.some(d => d.toDateString() === date.toDateString());
    };

    return (
        <div>
            <h2>Selecciona fecha y hora</h2>
            <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date)}
                filterDate={isDateAvailable} // Solo muestra fechas disponibles
                inline
            />
            <TimePicker
                onChange={setSelectedTime}
                value={selectedTime}
                disableClock={true} // Solo usa la rueda
            />
            <button
                onClick={() => onDateTimeSelect(selectedDate, selectedTime)}
                disabled={!selectedDate}
            >
                Confirmar
            </button>
        </div>
    );
};

export default DateTimeSelector;
