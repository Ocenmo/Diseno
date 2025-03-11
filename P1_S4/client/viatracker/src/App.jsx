import { useEffect, useState } from "react";
import axios from "axios";
import Table from "../components/Table";

function App() {
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Obtener el dato inicial
        axios.get("http://3.140.223.188:3000/datos")
            .then(response => {
                if (response.data.length > 0) {
                    setData([response.data[0]]); // Tomar solo el primer dato
                }
            })
            .catch(error => {
                console.error("Error al obtener datos:", error);
                setError("No se pudieron obtener los datos");
            });

        let ws;

        const connectWebSocket = () => {
            ws = new WebSocket("ws://3.140.223.188:3000");

            ws.onopen = () => {
                console.log("Conectado al WebSocket");
            };

            ws.onmessage = (event) => {
                try {
                    const newData = JSON.parse(event.data);
                    setData([newData]); // Reemplaza con el nuevo dato
                } catch (err) {
                    console.error("Error procesando mensaje WebSocket:", err);
                }
            };

            ws.onerror = (err) => {
                console.error("Error en WebSocket:", err);
                setTimeout(connectWebSocket, 3000); // Reintentar conexión después de 3 segundos
            };

            ws.onclose = () => {
                console.warn("Conexión WebSocket cerrada. Reintentando...");
                setTimeout(connectWebSocket, 3000);
            };
        };

        connectWebSocket();

        return () => {
            if (ws) ws.close();
        };
    }, []);

    return <Table data={data} error={error} />;
}

export default App;
