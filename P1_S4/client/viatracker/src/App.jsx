import { useEffect, useState } from "react";
import axios from "axios";
import Table from "../components/Table";

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
      const ws = new WebSocket("ws://3.140.223.188:3000");
      
      ws.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data);
          console.log("Nuevo dato recibido:", newData);
    
          setData([{
            id: newData.id ?? "N/A",
            latitude: newData.latitude ?? "N/A",
            longitude: newData.longitude ?? "N/A",
            timestamp: newData.timestamp ?? "N/A",
          }]);
    
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
    
      return () => ws.close(); // Cerrar WebSocket al desmontar
    
    }, []);
    

    return <Table data={data} error={error} />;
}

export default App;
