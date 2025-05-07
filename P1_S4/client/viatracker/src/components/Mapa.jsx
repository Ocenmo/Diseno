import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation } from "../services/api";

const Map = ({ vehiclesData }) => {
    // Estados para el vehículo 1
    const [positionCar1, setPositionCar1] = useState({ lat: 11.022092, lng: -74.851364 });
    const [pathCar1, setPathCar1] = useState([]);
    const [latestDataCar1, setLatestDataCar1] = useState(null);

    // Estados para el vehículo 2
    const [positionCar2, setPositionCar2] = useState(null);
    const [pathCar2, setPathCar2] = useState([]);
    const [latestDataCar2, setLatestDataCar2] = useState(null);

    // Carga inicial de las últimas ubicaciones conocidas
    useEffect(() => {
        const fetchInitialData = async () => {
        try {
            const initialData = await latestLocation();
            console.log("Datos iniciales de latestLocation:", initialData);
            initialData.forEach((data) => {
            const position = { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
            if (!isNaN(position.lat) && !isNaN(position.lng)) {
                if (data.carId === "car1") {
                setPositionCar1(position);
                setPathCar1([position]);
                setLatestDataCar1(data);
                } else if (data.carId === "car2") {
                setPositionCar2(position);
                setPathCar2([position]);
                setLatestDataCar2(data);
                }
            }
            });
        } catch (error) {
            console.error("Error al obtener datos iniciales:", error);
        }
        };
        fetchInitialData();
    }, []);

    // Actualización en tiempo real cuando cambian los datos de los vehículos
    useEffect(() => {
        if (vehiclesData && vehiclesData.length > 0) {
        vehiclesData.forEach((data) => {
            const position = { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
            if (!isNaN(position.lat) && !isNaN(position.lng)) {
            if (data.carId === "car1") {
                setPositionCar1(position);
                setPathCar1((prev) => [...prev, position]);
                setLatestDataCar1(data);
            } else if (data.carId === "car2") {
                setPositionCar2(position);
                setPathCar2((prev) => [...prev, position]);
                setLatestDataCar2(data);
            }
            }
        });
        }
    }, [vehiclesData]);

    return (
        <div className="flex-1 relative">
        <GoogleMap
            className="w-full h-full rounded-xl shadow-lg"
            options={{ disableDefaultUI: true, zoomControl: true }}
            zoom={15}
            center={positionCar1} // Centra en el vehículo 1 por defecto
            mapContainerStyle={{ width: "100%", height: "calc(100vh - 60px)" }}
        >
            {/* Marcador y polilínea para el vehículo 1 */}
            {positionCar1 && (
            <Marker
                position={positionCar1}
                icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#2d6a4f", // Verde para el vehículo 1
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

            {/* Marcador y polilínea para el vehículo 2 */}
            {positionCar2 && (
            <Marker
                position={positionCar2}
                icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#b56576", // Rosa para el vehículo 2
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
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-[80%] md:max-w-3xl px-4">
            <div className="bg-white p-4 border border-gray-300 rounded-xl shadow-md">
            <h3 className="font-bold mb-2">Datos de los vehículos</h3>
            <table className="table-auto w-full">
                <thead>
                <tr>
                    <th className="px-2"></th>
                    <th className="px-2">Vehículo 1</th>
                    <th className="px-2">Vehículo 2</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td className="px-2">Latitud</td>
                    <td className="px-2">{latestDataCar1 ? latestDataCar1.latitude : "N/A"}</td>
                    <td className="px-2">{latestDataCar2 ? latestDataCar2.latitude : "N/A"}</td>
                </tr>
                <tr>
                    <td className="px-2">Longitud</td>
                    <td className="px-2">{latestDataCar1 ? latestDataCar1.longitude : "N/A"}</td>
                    <td className="px-2">{latestDataCar2 ? latestDataCar2.longitude : "N/A"}</td>
                </tr>
                <tr>
                    <td className="px-2">RPM</td>
                    <td className="px-2">{latestDataCar1 ? latestDataCar1.rpm : "N/A"}</td>
                    <td className="px-2">{latestDataCar2 ? latestDataCar2.rpm : "N/A"}</td>
                </tr>
                <tr>
                    <td className="px-2">Velocidad</td>
                    <td className="px-2">{latestDataCar1 ? latestDataCar1.speed : "N/A"}</td>
                    <td className="px-2">{latestDataCar2 ? latestDataCar2.speed : "N/A"}</td>
                </tr>
                <tr>
                    <td className="px-2">Fecha y hora</td>
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
        </div>
    );
};

export default Map;