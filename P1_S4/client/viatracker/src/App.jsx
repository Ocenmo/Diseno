import { useState, useEffect, useRef } from "react";
import { connectWebSocket } from "./services/WebSocketService";
import Table from "./components/Table";
import Map from "./components/Mapa";
import DateRangeSidebar from "./components/DateRangeSidebar";
import { latestLocation, rutas } from "./services/api";
import { formatDateTime } from "./utils/utils";
import Rutas from "./pages/Rutas";
import { setOptions } from "@mobiscroll/react";
import MapWithCircle from "./pages/MapRadius";
import { useLoadScript } from "@react-google-maps/api";

setOptions({
    locale: "es",
    theme: "ios",
    themeVariant: "light"
});

const ApiKey = import.meta.env.VITE_API_KEY;
const googleMapsLibrary = ["geometry"];

function App() {
    const [data, setData] = useState(null);
    const [latitude, setLatitude] = useState(() => {
        return parseFloat(localStorage.getItem("latitude")) || 11.020082;
    });
    const [longitude, setLongitude] = useState(() => {
        return parseFloat(localStorage.getItem("longitude")) || -74.850364;
    });
    const [selectedRange, setSelectedRange] = useState(null);
    const [routeData, setRouteData] = useState([]);
    const [activeMap, setActiveMap] = useState("realTimeMap"); // Estado para controlar el mapa activo
    const [activeButton, setActiveButton] = useState("realTimeMap"); // Estado para rastrear el botón activo

    const wsRef = useRef(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
        libraries: googleMapsLibrary,
    });

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

    useEffect(() => {
        if (!selectedRange) return;
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

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const handleMapSwitch = (mapType) => {
        setActiveMap(mapType);
        setActiveButton(mapType); // Actualiza el botón activo
    };

    return (
        <>
            <header>
                <h1>ViaTracker</h1>
            </header>
            <section className="Botones">
                <button className="ButtonA" onClick={() => handleMapSwitch("realTimeMap")}>
                    Mapa en Tiempo Real
                </button>
                <button className="ButtonB" onClick={() => handleMapSwitch("routeMap")}>
                    Historico de Rutas
                </button>
                <button className="ButtonC" onClick={() => handleMapSwitch("circleMap")}>
                    Radio de busqueda
                </button>
            </section>
            <section>
                <div>
                    <h2 className="Title">
                        Ultima Ubicación
                    </h2>
                    <Table data={data ? [data] : []} />
                </div>

                {/* Mostrar el mapa según la selección */}
                <div className={`Mapa ${activeButton}`}>
                    <h2 className="MapaTitle">Mapa</h2>
                    {activeMap === "realTimeMap" && (
                        <Map latitude={latitude} longitude={longitude} routeData={routeData} />
                    )}
                    {activeMap === "routeMap" && <Rutas />}
                    {activeMap === "circleMap" && <MapWithCircle />}
                </div>
            </section>
        </>
    );
}

export default App;
