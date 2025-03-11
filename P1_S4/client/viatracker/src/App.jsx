import { useEffect, useState } from "react";
import axios from "axios";
import Table from "../components/Table";
import connectWebSocket from "./WebSocketService"; // Importamos el servicio
import Map from "../components/Mapa";

function App() {
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Obtener el último dato disponible desde el backend
        axios.get("http://3.140.223.188:3000/datos")
            .then(response => {
                if (response.data.length > 0) {
                    const lastData = response.data[response.data.length - 1]; // Último elemento del array
                    setData([{
                        id: lastData.id ?? "N/A",
                        latitude: lastData.latitude ?? "N/A",
                        longitude: lastData.longitude ?? "N/A",
                        timestamp: lastData.timestamp ?? "N/A",
                    }]);
                }
            })
            .catch(error => {
                console.error("Error al obtener datos iniciales:", error);
                setError("No se pudieron obtener los datos iniciales");
            });

        // Conectar WebSocket
        const ws = connectWebSocket(setData);

        return () => ws.close(); // Cerrar WebSocket al desmontar

    }, []);

    return (
        <>
          <Table data={data} error={error} />
          {data && <Map latitude={data.latitude} longitude={data.longitude} />}
        </>
    );
}

export default App;
