import { useState, useEffect, useRef } from "react";
import { connectWebSocket } from "./services/WebSocketService";
import Table from "./components/Table";
import Map from "./components/Mapa";
import { latestLocation } from "./services/api";
import { Temporal } from "@js-temporal/polyfill";
import DateTimeSelector from "./components/DatetimePicker";

function App() {
    const [data, setData] = useState(null);
    const [latitude, setLatitude] = useState(() => {
        return parseFloat(localStorage.getItem("latitude")) || 0;
    });
    const [longitude, setLongitude] = useState(() => {
        return parseFloat(localStorage.getItem("longitude")) || 0;
    });
    const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
    const [selectedTime, setSelectedTime] = useState("12:00");
    const [showDateTimePicker, setShowDateTimePicker] = useState(false);

    const wsRef = useRef(null);

    useEffect(() => {
        wsRef.current = connectWebSocket(updateLocation);
        return () => wsRef.current?.close();
    }, []);

    useEffect(() => {
        const getInitialData = async () => {
            const latestData = await latestLocation();
            if (latestData) {
                let initialData = {
                    id: latestData[0].id,
                    latitude: latestData[0].Latitud,
                    longitude: latestData[0].Longitud,
                    timestamp: Temporal.Instant.from(latestData[0].TimeStamp).toString()
                };
                updateLocation(initialData);
            }
        };
        getInitialData();
    }, []);

    function updateLocation(newData) {
        setData(newData);
        setLatitude(newData.latitude);
        setLongitude(newData.longitude);
        localStorage.setItem("latitude", newData.latitude);
        localStorage.setItem("longitude", newData.longitude);
    }

    function handleDateTimeSelect(dateRange, time) {
        setSelectedDateRange(dateRange);
        setSelectedTime(time);
        setShowDateTimePicker(false);
    }

    return (
        <>
            <header>
                <h1>ViaTracker</h1>
            </header>
            <section>
                <div>
                    <Table data={data ? [data] : []} />
                </div>
                <div className="Mapa">
                    <h2 className="MapaTitle">Mapa</h2>
                    <Map latitude={latitude} longitude={longitude} />
                </div>
                <div>
                    <button onClick={() => setShowDateTimePicker(true)}>Seleccionar Fecha y Hora</button>
                    {selectedDateRange[0] && selectedDateRange[1] && (
                        <p>Rango de fechas seleccionado: {selectedDateRange[0].toString()} - {selectedDateRange[1].toString()} a las {selectedTime}</p>
                    )}
                    {showDateTimePicker && (
                        <div className="modal">
                            <DateTimeSelector onDateTimeSelect={handleDateTimeSelect} />
                            <button onClick={() => setShowDateTimePicker(false)}>Cerrar</button>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

export default App;
