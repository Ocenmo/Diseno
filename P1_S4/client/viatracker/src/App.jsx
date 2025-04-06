import { useState, useEffect, useRef } from "react";
import { connectWebSocket } from "./services/WebSocketService";
import Map from "./components/Mapa";
import { latestLocation, rutas } from "./services/api";
import { formatDateTime } from "./utils/utils";
import Rutas from "./pages/Rutas";
import { setOptions } from "@mobiscroll/react";
import MapWithCircle from "./pages/MapRadius";
import { useLoadScript } from "@react-google-maps/api";
import "./App.css";

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
        setActiveButton(mapType);
    };

    return (
        <>
            <nav className="fixed top-0 z-50 w-full px-6 text-white font-sans transition-all duration-300 ease-out lg:px-12 bg-black py-6 shadow-none mask-b-from-80%">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-2 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">ViaTracker</h1>
                    </div>
                    <div className="hidden gap-6 lg:flex items-center">
                    <button className="relative text-white h-fit w-fit" onClick={() => handleMapSwitch("realTimeMap")}>
                    Mapa en Tiempo Real
                    <span style={{ transform: activeButton === "realTimeMap" ? "scaleX(1)" : "scaleX(0)" }}
                    className="absolute -bottom-2 -left-2 -right-2 h-1 origin-left rounded-full bg-indigo-500 transition-transform duration-300 ease-out"></span>
                    </button>
                    <button className="relative text-white h-fit w-fit" onClick={() => handleMapSwitch("routeMap")}>
                    Histórico de Rutas
                    <span style={{ transform: activeButton === "routeMap" ? "scaleX(1)" : "scaleX(0)" }}
                    className="absolute -bottom-2 -left-2 -right-2 h-1 origin-left rounded-full bg-indigo-500 transition-transform duration-300 ease-out"></span>
                    </button>
                    <button className="relative text-white h-fit w-fit" onClick={() => handleMapSwitch("circleMap")}>
                    Radio de búsqueda
                    <span style={{ transform: activeButton === "circleMap" ? "scaleX(1)" : "scaleX(0)" }}
                    className="absolute -bottom-2 -left-2 -right-2 h-1 origin-left rounded-full bg-indigo-500 transition-transform duration-300 ease-out"></span>
                    </button>
                    </div>
                </div>
            </nav>

            <section className="flex flex-row items-center justify-between mx-[4%] mt-[2%] flex-wrap pb-[5%]">
                <div className={`absolute inset-0 z-0 bg-gradient-to-b from-neutral-950/90 to-neutral-950/0 ${activeButton}`}>
                    {activeMap === "realTimeMap" && (
                        <Map latitude={latitude} longitude={longitude} routeData={routeData} data={data} />
                    )}
                    {activeMap === "routeMap" && <Rutas />}
                    {activeMap === "circleMap" && <MapWithCircle />}
                </div>
            </section>
        </>
    );
}

export default App;