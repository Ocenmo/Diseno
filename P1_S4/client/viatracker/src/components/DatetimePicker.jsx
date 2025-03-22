import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TimePicker from 'react-time-picker';
import { rangoFechas } from '../services/api';
import { Temporal } from '@js-temporal/polyfill';

const DateTimeSelector = ({ onDateTimeSelect }) => {
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedDates, setSelectedDates] = useState([null, null]);
    const [selectedTime, setSelectedTime] = useState('12:00');

    useEffect(() => {
        const fetchAvailableDates = async () => {
            try {
                const { inicio, fin } = await rangoFechas();
                if (!inicio || !fin) {
                    console.error("Datos de rango de fechas inválidos:", { inicio, fin });
                    return;
                }

                const startDate = Temporal.PlainDate.from(inicio);
                const endDate = Temporal.PlainDate.from(fin);

                let dates = [];
                let currentDate = startDate;
                while (Temporal.PlainDate.compare(currentDate, endDate) <= 0) {
                    dates.push(currentDate);
                    currentDate = currentDate.add({ days: 1 });
                }

                setAvailableDates(dates);
            } catch (error) {
                console.error("Error al obtener el rango de fechas:", error);
            }
        };
        fetchAvailableDates();
    }, []);

    const isDateAvailable = (date) => {
        const plainDate = Temporal.PlainDate.from(date.toISOString().split('T')[0]);
        return availableDates.some(d => Temporal.PlainDate.compare(d, plainDate) === 0);
    };

    return (
        <div>
            <h2>Selecciona un rango de fechas y una hora</h2>
            <DatePicker
                selected={selectedDates[0]}
                onChange={dates => setSelectedDates(dates)}
                startDate={selectedDates[0]}
                endDate={selectedDates[1]}
                selectsRange
                filterDate={isDateAvailable}
                inline
            />
            <TimePicker
                onChange={setSelectedTime}
                value={selectedTime}
                disableClock={true}
            />
            <button
                onClick={() => onDateTimeSelect(selectedDates, selectedTime)}
                disabled={!selectedDates[0] || !selectedDates[1]}
            >
                Confirmar
            </button>
        </div>
    );
};

export default DateTimeSelector;