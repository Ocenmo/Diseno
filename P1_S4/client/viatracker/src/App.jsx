import { useState, useEffect, useRef } from "react";
import { connectWebSocket } from "./services/WebSocketService";
import Table from "./components/Table";
import Map from "./components/Mapa";
import { latestLocation } from "./services/api";
import { formatDateTime } from "./utils/utils";

function App() {
    const [data, setData] = useState(null);
    const [latitude, setLatitude] = useState(() => {
        const latestData = latestLocation();
        return parseFloat(localStorage.getItem("latitude")) || -33.4372;
    });
    const [longitude, setLongitude] = useState(() => {
        const latestData = latestLocation();
        return parseFloat(localStorage.getItem("longitude")) || -70.6506;
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