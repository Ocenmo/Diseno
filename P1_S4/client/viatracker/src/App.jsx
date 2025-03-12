import { useState, useEffect } from "react";
import axios from "axios";
import Table from "../components/Table";
import Map from "../components/Mapa";
import connectWebSocket from "./WebSocketService";

function App() {
    const [data, setData] = useState(null);
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLongitude] = useState(0);

    useEffect(() => {
        // Intentar recuperar del localStorage
        const storedData = localStorage.getItem("lastLocation");
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            setData(parsedData);
            setLatitude(parsedData.latitude);
            setLongitude(parsedData.longitude);
        } else {
            // Si no hay datos en localStorage, obtener del backend
            axios.get("http://3.140.223.188:3000/datos")
                .then(response => {
                    if (response.data.length > 0) {
                        const lastData = response.data[response.data.length - 1];
                        setData(lastData);
                        setLatitude(lastData.latitude);
                        setLongitude(lastData.longitude);
                    }
                })
                .catch(error => {
                    console.error("Error al obtener datos iniciales:", error);
                });
        }

        // Conectar WebSocket
        const ws = connectWebSocket((newData) => {
            setData(newData);
            setLatitude(newData.latitude);
            setLongitude(newData.longitude);
        });

        return () => ws.close(); // Cierra WebSocket al desmontar
    }, []);

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
            </section>
        </>
    );
}

export default App;