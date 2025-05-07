import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation } from "../services/api";

const Map = ({ dataCar1, dataCar2 }) => {
    // Estados para las trayectorias de los carros
    const [pathCar1, setPathCar1] = useState([]);
    const [pathCar2, setPathCar2] = useState([]);
    const [selectedCar, setSelectedCar] = useState("both");
    const [mapCenter, setMapCenter] = useState({ lat: 11.022092, lng: -74.851364 });

    // Función para procesar datos como en rutas.jsx
    const processData = (data) => {
        if (data && data.latitude !== undefined && data.longitude !== undefined) {
        return {
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
            rpm: Number(data.rpm) || 0,
            speed: parseFloat(data.speed) || 0,
            timestamp: data.timestamp,
        };
        }
        return null;
    };

    // Obtener posiciones iniciales si no se pasan datos
    useEffect(() => {
        const fetchInitialPosition = async (carId, setPath) => {
        try {
            const latestData = await latestLocation(carId);
            if (latestData?.[0]?.latitude && latestData?.[0]?.longitude) {
            const initialPosition = processData(latestData[0]);
            if (initialPosition && !isNaN(initialPosition.lat) && !isNaN(initialPosition.lng)) {
                setPath([initialPosition]);
            }
            }
        } catch (error) {
            console.error(`Error fetching initial location for ${carId}:`, error);
        }
        };

        if (!dataCar1) fetchInitialPosition("car1", setPathCar1);
        if (!dataCar2) fetchInitialPosition("car2", setPathCar2);
    }, [dataCar1, dataCar2]);

    // Actualizar trayectorias cuando cambian los datos
    useEffect(() => {
        const updatePath = (data, setPath) => {
        const processedData = processData(data);
        if (processedData && !isNaN(processedData.lat) && !isNaN(processedData.lng)) {
            setPath((prevPath) => [...prevPath, processedData]);
        }
        };

        if (dataCar1) updatePath(dataCar1, setPathCar1);
        if (dataCar2) updatePath(dataCar2, setPathCar2);
    }, [dataCar1, dataCar2]);

    // Ajustar el centro del mapa según la selección
    useEffect(() => {
        const lastPointCar1 = pathCar1.length > 0 ? pathCar1[pathCar1.length - 1] : null;
        const lastPointCar2 = pathCar2.length > 0 ? pathCar2[pathCar2.length - 1] : null;

        if (selectedCar === "car1" && lastPointCar1) {
        setMapCenter({ lat: lastPointCar1.lat, lng: lastPointCar1.lng });
        } else if (selectedCar === "car2" && lastPointCar2) {
        setMapCenter({ lat: lastPointCar2.lat, lng: lastPointCar2.lng });
        } else if (selectedCar === "both") {
        if (lastPointCar1 && lastPointCar2) {
            const avgLat = (lastPointCar1.lat + lastPointCar2.lat) / 2;
            const avgLng = (lastPointCar1.lng + lastPointCar2.lng) / 2;
            setMapCenter({ lat: avgLat, lng: avgLng });
        } else if (lastPointCar1) {
            setMapCenter({ lat: lastPointCar1.lat, lng: lastPointCar1.lng });
        } else if (lastPointCar2) {
            setMapCenter({ lat: lastPointCar2.lat, lng: lastPointCar2.lng });
        }
        }
    }, [selectedCar, pathCar1, pathCar2]);

    // Obtener la última posición para usar en marcadores y tabla
    const lastPointCar1 = pathCar1.length > 0 ? pathCar1[pathCar1.length - 1] : null;
    const lastPointCar2 = pathCar2.length > 0 ? pathCar2[pathCar2.length - 1] : null;

    return (
        <div className="flex-1 relative">
        <GoogleMap
            className="w-full h-full rounded-xl shadow-lg"
            options={{ disableDefaultUI: true, zoomControl: true }}
            zoom={15}
            center={mapCenter}
            mapContainerStyle={{ width: "100%", height: "calc(100vh - 60px)" }}
        >
            {/* Selector de vehículos */}
            <div className="absolute top-10 right-10 z-10">
            <select
                value={selectedCar}
                onChange={(e) => setSelectedCar(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="car1">Carro 1</option>
                <option value="car2">Carro 2</option>
                <option value="both">Ambos</option>
            </select>
            </div>

            {/* Marcadores con colores diferentes */}
            {(selectedCar === "car1" || selectedCar === "both") && lastPointCar1 && (
            <Marker
                position={{ lat: lastPointCar1.lat, lng: lastPointCar1.lng }}
                icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
            />
            )}
            {(selectedCar === "car2" || selectedCar === "both") && lastPointCar2 && (
            <Marker
                position={{ lat: lastPointCar2.lat, lng: lastPointCar2.lng }}
                icon="https://maps.google.com/mapfiles/ms/icons/red-dot.png"
            />
            )}

            {/* Polilíneas */}
            {(selectedCar === "car1" || selectedCar === "both") && pathCar1.length > 1 && (
            <Polyline
                path={pathCar1.map((point) => ({ lat: point.lat, lng: point.lng }))}
                options={{ strokeColor: "#2d6a4f", strokeOpacity: 1, strokeWeight: 2 }}
            />
            )}
            {(selectedCar === "car2" || selectedCar === "both") && pathCar2.length > 1 && (
            <Polyline
                path={pathCar2.map((point) => ({ lat: point.lat, lng: point.lng }))}
                options={{ strokeColor: "#b56576", strokeOpacity: 1, strokeWeight: 2 }}
            />
            )}
        </GoogleMap>

        {/* Tabla de datos */}
        <div className="absolute bottom-5 left-5 z-10 bg-white p-4 border border-gray-300 rounded-xl shadow-md">
            {selectedCar === "car1" && lastPointCar1 && (
            <div>
                <h3 className="font-bold mb-2">Carro 1</h3>
                <p>Latitud: {lastPointCar1.lat}</p>
                <p>Longitud: {lastPointCar1.lng}</p>
                <p>RPM: {lastPointCar1.rpm}</p>
                <p>Velocidad: {lastPointCar1.speed}</p>
                <p>Fecha y hora: {new Date(lastPointCar1.timestamp).toLocaleString("es-CO", { timeZone: "UTC" })}</p>
            </div>
            )}
            {selectedCar === "car2" && lastPointCar2 && (
            <div>
                <h3 className="font-bold mb-2">Carro 2</h3>
                <p>Latitud: {lastPointCar2.lat}</p>
                <p>Longitud: {lastPointCar2.lng}</p>
                <p>RPM: {lastPointCar2.rpm}</p>
                <p>Velocidad: {lastPointCar2.speed}</p>
                <p>Fecha y hora: {new Date(lastPointCar2.timestamp).toLocaleString("es-CO", { timeZone: "UTC" })}</p>
            </div>
            )}
            {selectedCar === "both" && (
            <div>
                <h3 className="font-bold mb-2">Datos de los carros</h3>
                <table className="table-auto">
                <thead>
                    <tr>
                    <th></th>
                    <th className="px-2">Carro 1</th>
                    <th className="px-2">Carro 2</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <td>Latitud</td>
                    <td className="px-2">{lastPointCar1?.lat || "N/A"}</td>
                    <td className="px-2">{lastPointCar2?.lat || "N/A"}</td>
                    </tr>
                    <tr>
                    <td>Longitud</td>
                    <td className="px-2">{lastPointCar1?.lng || "N/A"}</td>
                    <td className="px-2">{lastPointCar2?.lng || "N/A"}</td>
                    </tr>
                    <tr>
                    <td>RPM</td>
                    <td className="px-2">{lastPointCar1?.rpm || "N/A"}</td>
                    <td className="px-2">{lastPointCar2?.rpm || "N/A"}</td>
                    </tr>
                    <tr>
                    <td>Velocidad</td>
                    <td className="px-2">{lastPointCar1?.speed || "N/A"}</td>
                    <td className="px-2">{lastPointCar2?.speed || "N/A"}</td>
                    </tr>
                    <tr>
                    <td>Fecha y hora</td>
                    <td className="px-2">
                        {lastPointCar1?.timestamp
                        ? new Date(lastPointCar1.timestamp).toLocaleString("es-CO", { timeZone: "UTC" })
                        : "N/A"}
                    </td>
                    <td className="px-2">
                        {lastPointCar2?.timestamp
                        ? new Date(lastPointCar2.timestamp).toLocaleString("es-CO", { timeZone: "UTC" })
                        : "N/A"}
                    </td>
                    </tr>
                </tbody>
                </table>
            </div>
            )}
        </div>
        </div>
    );
};

export default Map;