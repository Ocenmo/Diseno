import { useState, useEffect, useRef } from "react";
import { connectWebSocket } from "./services/WebSocketService";
import Table from "./components/Table";
import Map from "./components/Mapa";
import DateRangeSidebar from "./components/DateRangeSidebar";
import { latestLocation, rutas } from "./services/api";
import { formatDateTime } from "./utils/utils";
import Rutas from "./pages/Rutas";

function App() {
    const [data, setData] = useState(null);
    const [latitude, setLatitude] = useState(() => {
        return parseFloat(localStorage.getItem("latitude")) || -33.4372;
    });
    const [longitude, setLongitude] = useState(() => {
        return parseFloat(localStorage.getItem("longitude")) || -70.6506;
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);
    const [routeData, setRouteData] = useState([]); // Ruta obtenida según la fecha

    const wsRef = useRef(null);

    useEffect(() => {
        wsRef.current = connectWebSocket(updateLocation);
        return () => wsRef.current?.close();
    }, []);

    useEffect(() => {
        const getInitialData = async () => {
            const latestData = await latestLocation();
            if (latestData) {
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
    }

    // Cuando `selectedRange` cambia, se obtiene la ruta del backend
    useEffect(() => {
        if (!selectedRange) return; // Si no hay rango, no se hace la petición
        const fetchRoute = async () => {
            const inicio = selectedRange.startDate.toISOString();
            const fin = selectedRange.endDate.toISOString();
            try {
                const route = await rutas(inicio, fin);
                setRouteData(route);
            } catch (error) {
                console.error("Error obteniendo ruta:", error);
            }
        };
        fetchRoute();
    }, [selectedRange]);

    function handleApplyDateRange(range) {
        setSelectedRange({
            startDate: range[0].startDate,
            endDate: range[0].endDate
        });
        setIsSidebarOpen(false);
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
                    <Map latitude={latitude} longitude={longitude} routeData={routeData} />
                </div>
                <Rutas />
            </section>
            <DateRangeSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onApply={handleApplyDateRange} />
        </>
    );
}

export default App;
