import { useState, useEffect, useRef } from "react";
import { connectWebSocket } from "./services/WebSocketService";
import Map from "./components/Mapa";
import { latestLocation, rutas } from "./services/api";
import Rutas from "./pages/Rutas";
import { setOptions } from "@mobiscroll/react";
import MapWithCircle from "./pages/MapRadius";
import HeatMap from "./pages/HeatMap";
import { useLoadScript } from "@react-google-maps/api";
import "./App.css";
import { formatDateTime } from "./utils/utils";

setOptions({
    locale: "es",
    theme: "ios",
    themeVariant: "light"
});

const ApiKey = import.meta.env.VITE_API_KEY;
const googleMapsLibrary = ["geometry", "visualization"];

const navItems = [
    { label: "Mapa en Tiempo Real", key: "realTimeMap", description: "Muestra la ubicación actual de los vehículos en tiempo real." },
    { label: "Histórico de Rutas", key: "routeMap", description: "Visualiza las rutas recorridas por los vehículos en un rango de fechas seleccionado." },
    { label: "Radio de búsqueda", key: "circleMap", description: "Permite definir un radio de búsqueda alrededor de un punto en el mapa." },
    { label: "Mapa de Calor", key: "heatmap", description: "Muestra un mapa de calor basado en la densidad de datos de ubicación." },
];

function App() {
    const [positionCar1, setPositionCar1] = useState(null);
    const [positionCar2, setPositionCar2] = useState(null);
    const [pathCar1, setPathCar1] = useState([]);
    const [pathCar2, setPathCar2] = useState([]);
    const [selectedRange, setSelectedRange] = useState(null);
    const [routeData, setRouteData] = useState([]);
    const [activeMap, setActiveMap] = useState("realTimeMap");
    const [activeButton, setActiveButton] = useState("realTimeMap");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState("both");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState("");

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
            try {
                const latestData = await latestLocation();
                console.log("Datos iniciales de latestLocation:", latestData);
                if (latestData && latestData.length > 0) {
                    latestData.forEach((data) => {
                        const newPosition = {
                            lat: parseFloat(data.Latitud),
                            lng: parseFloat(data.Longitud),
                            rpm: Number(data.rpm) || 0,
                            speed: parseFloat(data.speed) || 0,
                            timestamp: formatDateTime(data.TimeStamp),
                        };
                        if (data.carId === "car1") {
                            setPositionCar1(newPosition);
                            setPathCar1([newPosition]);
                        } else if (data.carId === "car2") {
                            setPositionCar2(newPosition);
                            setPathCar2([newPosition]);
                        }
                    });
                }
            } catch (error) {
                console.error("Error al obtener datos iniciales:", error);
            }
        };
        getInitialData();
    }, []);

    function updateLocation(newData) {
        console.log("Datos recibidos del WebSocket:", newData);
        const newPosition = {
            lat: parseFloat(newData.latitude),
            lng: parseFloat(newData.longitude),
            rpm: Number(newData.rpm) || 0,
            speed: parseFloat(newData.speed) || 0,
            timestamp: newData.TimeStamp,
        };
        if (newData.carId === "car1") {
            setPositionCar1(newPosition);
            setPathCar1((prev) => [...prev, newPosition]);
        } else if (newData.carId === "car2") {
            setPositionCar2(newPosition);
            setPathCar2((prev) => [...prev, newPosition]);
        }
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
        setIsMenuOpen(false);
    };

    const openModal = (description) => {
        setModalContent(description);
        setIsModalOpen(true);
    };

    return (
        <>
            <nav className="relative top-0 z-10 w-full px-4 sm:px-6 lg:px-12 py-4 bg-[#E9F1FA] text-[#14213d] font-sans transition-all duration-300 ease-out shadow-md mask-b-from-90%">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold">ViaTracker</h1>
                    </div>
                    <div className="hidden lg:flex gap-4 sm:gap-6 items-center">
                        {navItems.map(({ label, key }) => (
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
                    <div className="lg:hidden ">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#14213d] focus:outline-none">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            <div className={`lg:hidden fixed top-16 left-0 w-full bg-white shadow-lg z-50 transition-all duration-300 ease-in-out transform ${isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}>
                <div className="flex flex-col items-center py-4">
                    {navItems.map(({ label, key, description }) => (
                        <div key={key} className="flex items-center justify-between w-full px-4 py-2">
                            <button
                                className="text-[#14213d] hover:animate-wiggle hover:scale-110 transition-all duration-300 ease-out font-semibold text-sm sm:text-base"
                                onClick={() => handleMapSwitch(key)}
                            >
                                {label}
                            </button>
                            <button
                                onClick={() => openModal(description)}
                                className="text-[#14213d] focus:outline-none ml-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                        <h2 className="text-lg font-semibold mb-4">Información</h2>
                        <p>{modalContent}</p>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            <section className="relative w-full h-screen -mt-3 mask-t-from-95%">
                <div className={`relative z-0 w-full h-full bg-gradient-to-b from-neutral-950/90 to-neutral-950/0 ${activeButton}`}>
                    <button
                        onClick={() => openModal(navItems.find(item => item.key === activeMap).description)}
                        className="absolute top-4 left-4 z-10 bg-white text-[#14213d] rounded-full p-2 shadow-md hover:bg-gray-100 focus:outline-none"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    {activeMap === "realTimeMap" && (
                        <Map
                            positionCar1={positionCar1}
                            positionCar2={positionCar2}
                            pathCar1={pathCar1}
                            pathCar2={pathCar2}
                            selectedCar={selectedCar}
                            onSelectedCarChange={setSelectedCar}
                        />
                    )}
                    {activeMap === "routeMap" && <Rutas />}
                    {activeMap === "circleMap" && <MapWithCircle />}
                    {activeMap === "heatmap" && <HeatMap />}
                </div>
            </section>
        </>
    );
}

export default App;