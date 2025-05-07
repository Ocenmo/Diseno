import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation } from "../services/api";

const Map = ({ vehiclesData }) => {
    // Estados para el vehículo 1 (car1)
    const [positionCar1, setPositionCar1] = useState(null);
    const [pathCar1, setPathCar1] = useState([]);
    const [latestDataCar1, setLatestDataCar1] = useState(null);

    // Estados para el vehículo 2 (car2)
    const [positionCar2, setPositionCar2] = useState(null);
    const [pathCar2, setPathCar2] = useState([]);
    const [latestDataCar2, setLatestDataCar2] = useState(null);

    // Efecto para manejar las actualizaciones de datos
    useEffect(() => {
        // Función auxiliar para actualizar los estados de un vehículo
        const updateVehicleData = (data, setPosition, setPath, setLatestData) => {
        const newPosition = { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
        if (!isNaN(newPosition.lat) && !isNaN(newPosition.lng)) {
            // Solo actualizamos si la posición es válida
            setPosition(newPosition);
            // Agregamos la nueva posición al path para la polilínea
            setPath((prev) => [...prev, newPosition]);
            setLatestData(data);
        }
        };

        // Si se proporcionan datos en tiempo real
        if (vehiclesData && vehiclesData.length > 0) {
        vehiclesData.forEach((data) => {
            if (data.carId === "car1") {
            updateVehicleData(data, setPositionCar1, setPathCar1, setLatestDataCar1);
            } else if (data.carId === "car2") {
            updateVehicleData(data, setPositionCar2, setPathCar2, setLatestDataCar2);
            }
        });
        } else {
        // Si no hay datos en tiempo real, obtenemos las últimas ubicaciones conocidas
        const fetchInitialData = async () => {
            try {
            const latestData = await latestLocation(); // Asumimos que devuelve datos para ambos vehículos
            if (latestData && latestData.length > 0) {
                latestData.forEach((data) => {
                if (data.carId === "car1") {
                    updateVehicleData(data, setPositionCar1, setPathCar1, setLatestDataCar1);
                } else if (data.carId === "car2") {
                    updateVehicleData(data, setPositionCar2, setPathCar2, setLatestDataCar2);
                }
                });
            }
            } catch (error) {
            console.error("Error al obtener datos iniciales:", error);
            }
        };
        fetchInitialData();
        }
    }, [vehiclesData]);

    return (
        <div className="flex-1 relative">
        <GoogleMap
            className="w-full h-full rounded-xl shadow-lg"
            options={{ disableDefaultUI: true, zoomControl: true }}
            zoom={15}
            center={positionCar1 || { lat: 11.022092, lng: -74.851364 }} // Centra en car1 o posición por defecto
            mapContainerStyle={{ width: "100%", height: "calc(100vh - 60px)" }}
        >
            {/* Marcador y polilínea para car1 */}
            {positionCar1 && (
            <Marker
                position={positionCar1}
                icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#2d6a4f", // Verde para car1
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff",
                }}
            />
            )}
            {pathCar1.length > 1 && (
            <Polyline
                path={pathCar1}
                options={{ strokeColor: "#2d6a4f", strokeOpacity: 1, strokeWeight: 2 }}
            />
            )}

            {/* Marcador y polilínea para car2 */}
            {positionCar2 && (
            <Marker
                position={positionCar2}
                icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#b56576", // Rosa para car2
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff",
                }}
            />
            )}
            {pathCar2.length > 1 && (
            <Polyline
                path={pathCar2}
                options={{ strokeColor: "#b56576", strokeOpacity: 1, strokeWeight: 2 }}
            />
            )}
        </GoogleMap>

        {/* Tabla con datos de ambos vehículos */}
        <div className="absolute bottom-5 left-5 z-10 bg-white p-4 border border-gray-300 rounded-xl shadow-md">
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
                <td className="px-2">{latestDataCar1 ? latestDataCar1.latitude : "N/A"}</td>
                <td className="px-2">{latestDataCar2 ? latestDataCar2.latitude : "N/A"}</td>
                </tr>
                <tr>
                <td>Longitud</td>
                <td className="px-2">{latestDataCar1 ? latestDataCar1.longitude : "N/A"}</td>
                <td className="px-2">{latestDataCar2 ? latestDataCar2.longitude : "N/A"}</td>
                </tr>
                <tr>
                <td>RPM</td>
                <td className="px-2">{latestDataCar1 ? latestDataCar1.rpm : "N/A"}</td>
                <td className="px-2">{latestDataCar2 ? latestDataCar2.rpm : "N/A"}</td>
                </tr>
                <tr>
                <td>Velocidad</td>
                <td className="px-2">{latestDataCar1 ? latestDataCar1.speed : "N/A"}</td>
                <td className="px-2">{latestDataCar2 ? latestDataCar2.speed : "N/A"}</td>
                </tr>
                <tr>
                <td>Fecha y hora</td>
                <td className="px-2">
                    {latestDataCar1
                    ? new Date(latestDataCar1.timestamp).toLocaleString("es-CO", { timeZone: "UTC" })
                    : "N/A"}
                </td>
                <td className="px-2">
                    {latestDataCar2
                    ? new Date(latestDataCar2.timestamp).toLocaleString("es-CO", { timeZone: "UTC" })
                    : "N/A"}
                </td>
                </tr>
            </tbody>
            </table>
        </div>
        </div>
    );
};

export default Map;