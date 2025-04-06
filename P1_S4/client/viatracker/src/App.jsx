import { useState, useEffect, useRef } from "react";
import { connectWebSocket } from "./services/WebSocketService";
import Table from "./components/Table";
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
            <header className="bg-black min-h-[20%] flex flex-row items-center justify-center text-[130%] text-white rounded-full backdrop-blur-md">
                <h1>ViaTracker</h1>
            </header>
            <section className="flex flex-row justify-between items-center pb-[2%]">
                <button className="bg-[#14213d] text-white border-[3px] border-[#090f1b] px-5 py-2 text-[16px] m-1 cursor-pointer rounded hover:bg-[#090f1b] hover:text-white hover:scale-105 transition duration-300 ease-in-out" onClick={() => handleMapSwitch("realTimeMap")}>
                    Mapa en Tiempo Real
                </button>
                <button className="bg-[#fca311] text-black border-[3px] border-[#9c650c] px-5 py-2 text-[16px] m-1 cursor-pointer rounded hover:bg-[#9c650c] hover:text-white hover:scale-105 transition duration-300 ease-in-out" onClick={() => handleMapSwitch("routeMap")}>
                    Historico de Rutas
                </button>
                <button className="bg-[#989fce] text-black border-[3px] border-[#5b6080] px-5 py-2 text-[16px] m-1 cursor-pointer rounded hover:bg-[#5b6080] hover:text-white hover:scale-105 transition duration-300 ease-in-out" onClick={() => handleMapSwitch("circleMap")}>
                    Radio de busqueda
                </button>
            </section>
            <section className="flex flex-row items-center justify-between mx-[4%] mt-[2%] flex-wrap pb-[5%]">
                {/* Mostrar el mapa según la selección */}
                <div className={`h-[80%] w-1/2 shadow-md transition-transform duration-300 ease-in-out rounded-[1%] overflow-hidden ${activeButton}`}>
                    <h2 className="text-[180%] mt-[5%] mb-[2%] ml-[1%] text-[#14213d] text-center">Mapa</h2>
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
