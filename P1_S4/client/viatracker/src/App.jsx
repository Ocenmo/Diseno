import { useState, useEffect } from "react";
import axios from "axios";
import Table from "../components/Table";
import Map from "../components/Mapa";
import { saveLastLocation, getLastLocation } from "../components/storageService"; // Importamos las funciones

function App() {
    const [data, setData] = useState(null);
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLongitude] = useState(0);

    useEffect(() => {
        // Cargar última ubicación desde localStorage
        const savedData = getLastLocation();
        if (savedData) {
            setData(savedData);
            setLatitude(savedData.latitude);
            setLongitude(savedData.longitude);
        }

        // Obtener el último dato desde el backend
        axios.get("http://3.140.223.188:3000/datos")
            .then(response => {
                if (response.data.length > 0) {
                    const lastData = response.data[response.data.length - 1];
                    setData(lastData);
                    setLatitude(lastData.latitude);
                    setLongitude(lastData.longitude);

                    // Guardar en localStorage
                    saveLastLocation(lastData);
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

                // Guardar en localStorage
                saveLastLocation(newData);
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
