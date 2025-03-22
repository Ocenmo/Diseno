import { useState, useEffect, useRef } from "react";
import { connectWebSocket } from "./services/WebSocketService";
import Table from "./components/Table";
import Map from "./components/Mapa";
import { latestLocation } from "./services/api";
import { formatDateTime } from "./utils/utils";
import DateTimeSelector from "./components/DatetimePicker";

function App() {
    const [data, setData] = useState(null);
    const [latitude, setLatitude] = useState(() => {
        return parseFloat(localStorage.getItem("latitude"));
    });
    const [longitude, setLongitude] = useState(() => {
        return parseFloat(localStorage.getItem("longitude"));
    });
    const [selectedDateTime, setSelectedDateTime] = useState(null);
    const [showDateTimePicker, setShowDateTimePicker] = useState(false);

    const wsRef = useRef(null);

    useEffect(() => {
        wsRef.current = connectWebSocket(updateLocation);
        console.log("Current location", JSON.stringify(wsRef.current));
        return () => wsRef.current?.close();
    }, []);

    useEffect(() => {
        const getInitialData = async () => {
            const latestData = await latestLocation();
            console.log("Latest data:", latestData);
            if (latestData) {
                let initialData = {
                    id: latestData[0].id,
                    latitude: latestData[0].Latitud,
                    longitude: latestData[0].Longitud,
                    timestamp: formatDateTime(latestData[0].TimeStamp),
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
        console.log("Location updated:", latitude, longitude);
        console.log("Data:", data);
    }

    function handleDateTimeSelect(date, time) {
        setSelectedDateTime(`${date.toLocaleDateString()} ${time}`);
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
                    {selectedDateTime && <p>Fecha y Hora Seleccionada: {selectedDateTime}</p>}
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
