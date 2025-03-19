import { useState, useEffect, useRef } from "react";
import { connectWebSocket } from "./services/WebSocketService";
import Table from "./components/Table";
import Map from "./components/Mapa";
import { latestLocation } from "./services/api";

function App() {
    const [data, setData] = useState(null);
    const [latitude, setLatitude] = useState(() => {
        return parseFloat(localStorage.getItem("latitude")) || 37.7749;
    });
    const [longitude, setLongitude] = useState(() => {
        return parseFloat(localStorage.getItem("longitude")) || -122.4194;
    });

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
            if (latestData){
                let initialData = {
                    id: latestData[0].id,
                    latitude: latestData[0].Latitud,
                    longitude: latestData[0].Longitud,
                    timestamp: latestData[0].TimeStamp,
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