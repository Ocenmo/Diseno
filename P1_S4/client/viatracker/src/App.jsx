import { useState, useEffect, useRef } from "react";
import { connectWebSocket } from "./services/WebSocketService";
import Map from "./components/Mapa";
import { latestLocation, rutas } from "./services/api";
//import { formatDateTime } from "./utils/utils";
import Rutas from "./pages/Rutas";
import { setOptions } from "@mobiscroll/react";
import MapWithCircle from "./pages/MapRadius";
import HeatMap from "./pages/HeatMap"; // Importar el componente
import { useLoadScript } from "@react-google-maps/api";
import "./App.css";

setOptions({
    locale: "es",
    theme: "ios",
    themeVariant: "light"
});

const ApiKey = import.meta.env.VITE_API_KEY;
const googleMapsLibrary = ["geometry", "visualization"]; // Añadir 'visualization' para el mapa de calor

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
    const [activeMap, setActiveMap] = useState("realTimeMap");
    const [activeButton, setActiveButton] = useState("realTimeMap");

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
            console.log("Datos iniciales de latestLocation:", latestData); // Log detallado
            if (latestData) {
                let initialData = {
                    id: latestData[0].id,
                    latitude: latestData[0].Latitud,
                    longitude: latestData[0].Longitud,
                    timestamp: latestData[0].TimeStamp,
                    speed: latestData[0].speed || 0,
                    rpm: latestData[0].rpm || 0,
                };
                updateLocation(initialData);
            }
        };
        getInitialData();
    }, []);

    function updateLocation(newData) {
        console.log("Datos recibidos del WebSocket:", newData); // Log detallado
        setData(newData);
        setLatitude(newData.latitude);
        setLongitude(newData.longitude);
        localStorage.setItem("latitude", newData.latitude);
        localStorage.setItem("longitude", newData.longitude);
        localStorage.setItem("rpm", newData.rpm || 0);
        localStorage.setItem("speed", newData.speed || 0);
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

    if (!isLoaded) return <p className="text-center text-lg py-20">Cargando mapa...</p>;

    const handleMapSwitch = (mapType) => {
        setActiveMap(mapType);
        setActiveButton(mapType);
    };

    return (
        <>
            <nav className="relative top-0 z-0 w-full px-4 sm:px-6 lg:px-12 py-4 bg-[#E9F1FA] text-[#14213d] font-sans transition-all duration-300 ease-out shadow-md mask-b-from-95% mask-b-to-100%">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold">ViaTracker</h1>
                    </div>
                    <div className="hidden lg:flex gap-4 sm:gap-6 items-center">
                        {[
                            { label: "Mapa en Tiempo Real", key: "realTimeMap" },
                            { label: "Histórico de Rutas", key: "routeMap" },
                            { label: "Radio de búsqueda", key: "circleMap" },
                            { label: "Mapa de Calor", key: "heatmap" }, // Botón añadido
                        ].map(({ label, key }) => (
                            <button
                                key={key}
                                className="relative text-[#14213d] h-fit w-fit hover:animate-wiggle hover:scale-110 transition-all duration-300 ease-out font-semibold text-sm sm:text-base px-4 py-2 rounded-lg"
                                onClick={() => handleMapSwitch(key)}
                            >
                                {label}
                                <span
                                    style={{ transform: activeButton === key ? "scaleX(1)" : "scaleX(0)" }}
                                    className="absolute -bottom-2 -left-2 -right-2 h-1 origin-left rounded-full bg-indigo-500 transition-transform duration-300 ease-out"
                                ></span>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <section className="relative w-full h-screen -mt-3 mask-t-from-80%">
                <div className={`relative z-0 w-full h-full bg-gradient-to-b from-neutral-950/90 to-neutral-950/0 ${activeButton}`}>
                    {activeMap === "realTimeMap" && (
                        <Map latitude={latitude} longitude={longitude} routeData={routeData} data={data} />
                    )}
                    {activeMap === "routeMap" && <Rutas />}
                    {activeMap === "circleMap" && <MapWithCircle />}
                    {activeMap === "heatmap" && <HeatMap />} {/* Renderizar el mapa de calor */}
                </div>
            </section>
        </>
    );
}

export default App;