import { useState, useEffect } from "react";
import axios from "axios";
import Table from "../components/Table";
import Map from "../components/Mapa";

function App() {
    const [data, setData] = useState(null);
    const [latitude, setLatitude] = useState(
        parseFloat(localStorage.getItem("latitude")) || 37.7749
    );
    const [longitude, setLongitude] = useState(
        parseFloat(localStorage.getItem("longitude")) || -122.4194
    );

    useEffect(() => {
        axios.get("http://3.140.223.188:3000/datos")
            .then(response => {
            // Check if there's any data to read.
            if (response.data.length > 0) {
                // Retrieve last position using length-1
                const lastData = response.data[response.data.length - 1];
                if (isValidCoordinate(lastData.latitude, lastData.longitude)) {
                    updateLocation(lastData);
                }
            }
            console.log("Datos iniciales:", response.data);
            console.log("Latitude:", latitude, "Longitude:", longitude);
            console.log("data:", lastData);
            console.log("response.data:", response.data);
            })
    .catch(error => {
        console.error("Error al obtener datos iniciales:", error);
    }
);

        // WebSocket
        const ws = new WebSocket("ws://3.140.223.188:3000/datos");

        ws.onmessage = (event) => {
            try {
                const newData = JSON.parse(event.data);
                if (isValidCoordinate(newData.latitude, newData.longitude)) {
                    updateLocation(newData);
                }
            } catch (err) {
                console.error("Error procesando mensaje WebSocket:", err);
            }
        };

        ws.onerror = (err) => console.error("Error en WebSocket:", err);
        ws.onclose = () => console.warn("Conexión WebSocket cerrada");

        return () => ws.close();

    }, []);

    function isValidCoordinate(lat, lng) {
        return typeof lat === "number" && typeof lng === "number" &&
                isFinite(lat) && isFinite(lng);
    }

    function updateLocation(newData) {
        setData(newData);
        setLatitude(newData.latitude);
        setLongitude(newData.longitude);
        localStorage.setItem("latitude", newData.latitude);
        localStorage.setItem("longitude", newData.longitude);
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
            </section>
        </>
    );
}

export default App;
