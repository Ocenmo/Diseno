import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TimePicker from 'react-time-picker';
import { rangoFechas } from '../services/api';

const DateTimeSelector = ({ onDateTimeSelect }) => {
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedDates, setSelectedDates] = useState([null, null]);
    const [selectedTime, setSelectedTime] = useState('12:00');

    useEffect(() => {
        const fetchAvailableDates = async () => {
            const availableDates = await rangoFechas();
            const { inicio, fin } = availableDates;
            setAvailableDates([...Array((new Date(fin) - new Date(inicio)) / (1000 * 60 * 60 * 24) + 1)]
                .map((_, i) => new Date(new Date(inicio).setDate(new Date(inicio).getDate() + i)))
            );
        };
        fetchAvailableDates();
    }, []);

    const isDateAvailable = date => {
        return availableDates.some(d => new Date(d).toDateString() === date.toDateString());
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
