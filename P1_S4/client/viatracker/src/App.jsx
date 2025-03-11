import { useState, useEffect } from "react";
import axios from "axios";
import Table from "../components/Table";
import Map from "../components/Mapa";

function App() {
    const [data, setData] = useState(null);
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLongitude] = useState(0);

    useEffect(() => {
        // Obtener el último dato disponible desde el backend
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

        // Conectar WebSocket
        const ws = new WebSocket("ws://3.140.223.188:3000");

        ws.onmessage = (event) => {
            try {
                const newData = JSON.parse(event.data);
                setData(newData);
                setLatitude(newData.latitude);
                setLongitude(newData.longitude);
            } catch (err) {
                console.error("Error procesando mensaje WebSocket:", err);
            }
        };

        ws.onerror = (err) => {
            console.error("Error en WebSocket:", err);
        };

        ws.onclose = () => {
            console.warn("Conexión WebSocket cerrada");
        };

        return () => ws.close(); // Cierra WebSocket cuando el componente se desmonta

    }, []);

    return (
        <>
            <Table data={data ? [data] : []} />
            <Map latitude={latitude} longitude={longitude} />
        </>
    );
}

export default App;
