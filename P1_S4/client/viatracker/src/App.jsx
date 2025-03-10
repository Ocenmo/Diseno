import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Obtener datos iniciales
    axios.get("http://3.140.223.188:3000/datos")
      .then(response => setData(response.data))
      .catch(error => {
        console.error("Error al obtener datos:", error);
        setError("No se pudieron obtener los datos");
      });

    // Conectar WebSocket
    const ws = new WebSocket("ws://3.140.223.188:3000");
    ws.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);
        setData(prevData => [newData, ...prevData]); // Agrega nuevos datos a la lista
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

  return (
    <div>
      <h1>Datos del Backend</h1>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : data.length > 0 ? (
        <table border="1" style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Latitud</th>
              <th>Longitud</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.Latitud}</td>
                <td>{item.Longitud}</td>
                <td>{item.TimeStamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
  );
}

export default App;