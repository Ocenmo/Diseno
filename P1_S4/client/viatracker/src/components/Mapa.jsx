import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation } from "../services/api";

const Map = ({ dataCar1, dataCar2 }) => {
    // Estados para las posiciones y trayectorias de los carros
    const [positionCar1, setPositionCar1] = useState({ lat: 11.022092, lng: -74.851364 });
    const [positionCar2, setPositionCar2] = useState({ lat: 11.022092, lng: -74.851364 });
    const [pathCar1, setPathCar1] = useState([]);
    const [pathCar2, setPathCar2] = useState([]);
    const [selectedCar, setSelectedCar] = useState("both");
    const [mapCenter, setMapCenter] = useState({ lat: 11.022092, lng: -74.851364 });

    // Actualizar posiciones y trayectorias cuando cambian los datos
    useEffect(() => {
        const updatePosition = (data, setPosition, setPath) => {
        if (data && data.latitude !== undefined && data.longitude !== undefined) {
            const newPosition = { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
            if (!isNaN(newPosition.lat) && !isNaN(newPosition.lng)) {
            setPosition(newPosition);
            setPath((prevPath) => [...prevPath, newPosition]);
            }
        }
        };

        updatePosition(dataCar1, setPositionCar1, setPathCar1);
        updatePosition(dataCar2, setPositionCar2, setPathCar2);
    }, [dataCar1, dataCar2]);

    // Obtener posiciones iniciales si no se pasan datos
    useEffect(() => {
        const fetchInitialPositions = async () => {
        try {
            const [latestCar1, latestCar2] = await Promise.all([
            latestLocation("car1"),
            latestLocation("car2"),
            ]);
            if (latestCar1?.[0]?.latitude && latestCar1?.[0]?.longitude) {
            const initialPositionCar1 = {
                lat: parseFloat(latestCar1[0].latitude),
                lng: parseFloat(latestCar1[0].longitude),
            };
            if (!isNaN(initialPositionCar1.lat) && !isNaN(initialPositionCar1.lng)) {
                setPositionCar1(initialPositionCar1);
                setPathCar1([initialPositionCar1]);
            }
            }
            if (latestCar2?.[0]?.latitude && latestCar2?.[0]?.longitude) {
            const initialPositionCar2 = {
                lat: parseFloat(latestCar2[0].latitude),
                lng: parseFloat(latestCar2[0].longitude),
            };
            if (!isNaN(initialPositionCar2.lat) && !isNaN(initialPositionCar2.lng)) {
                setPositionCar2(initialPositionCar2);
                setPathCar2([initialPositionCar2]);
            }
            }
        } catch (error) {
            console.error("Error fetching initial locations:", error);
        }
        };

        if (!dataCar1 && !dataCar2) {
        fetchInitialPositions();
        }
    }, []);

    // Ajustar el centro del mapa según la selección
    useEffect(() => {
        if (selectedCar === "car1" && positionCar1) {
        setMapCenter(positionCar1);
        } else if (selectedCar === "car2" && positionCar2) {
        setMapCenter(positionCar2);
        } else if (selectedCar === "both") {
        if (positionCar1 && positionCar2) {
            const avgLat = (positionCar1.lat + positionCar2.lat) / 2;
            const avgLng = (positionCar1.lng + positionCar2.lng) / 2;
            setMapCenter({ lat: avgLat, lng: avgLng });
        } else if (positionCar1) {
            setMapCenter(positionCar1);
        } else if (positionCar2) {
            setMapCenter(positionCar2);
        }
        }
    }, [selectedCar, positionCar1, positionCar2]);

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
            {(selectedCar === "car1" || selectedCar === "both") && positionCar1 && (
            <Marker
                position={positionCar1}
                icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
            />
            )}
            {(selectedCar === "car2" || selectedCar === "both") && positionCar2 && (
            <Marker
                position={positionCar2}
                icon="https://maps.google.com/mapfiles/ms/icons/red-dot.png"
            />
            )}

            {/* Polilíneas */}
            {(selectedCar === "car1" || selectedCar === "both") && pathCar1.length > 1 && (
            <Polyline
                path={pathCar1}
                options={{ strokeColor: "#2d6a4f", strokeOpacity: 1, strokeWeight: 2 }}
            />
            )}
            {(selectedCar === "car2" || selectedCar === "both") && pathCar2.length > 1 && (
            <Polyline
                path={pathCar2}
                options={{ strokeColor: "#b56576", strokeOpacity: 1, strokeWeight: 2 }}
            />
            )}
        </GoogleMap>

        {/* Tabla de datos */}
        <div className="absolute bottom-5 left-5 z-10 bg-white p-4 border border-gray-300 rounded-xl shadow-md">
            {selectedCar === "car1" && dataCar1 && (
            <div>
                <h3 className="font-bold mb-2">Carro 1</h3>
                <p>Latitud: {dataCar1.latitude}</p>
                <p>Longitud: {dataCar1.longitude}</p>
                <p>RPM: {dataCar1.rpm}</p>
                <p>Velocidad: {dataCar1.speed}</p>
                <p>Fecha y hora: {dataCar1.timestamp}</p>
            </div>
            )}
            {selectedCar === "car2" && dataCar2 && (
            <div>
                <h3 className="font-bold mb-2">Carro 2</h3>
                <p>Latitud: {dataCar2.latitude}</p>
                <p>Longitud: {dataCar2.longitude}</p>
                <p>RPM: {dataCar2.rpm}</p>
                <p>Velocidad: {dataCar2.speed}</p>
                <p>Fecha y hora: {dataCar2.timestamp}</p>
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
                    <td className="px-2">{dataCar1?.latitude || "N/A"}</td>
                    <td className="px-2">{dataCar2?.latitude || "N/A"}</td>
                    </tr>
                    <tr>
                    <td>Longitud</td>
                    <td className="px-2">{dataCar1?.longitude || "N/A"}</td>
                    <td className="px-2">{dataCar2?.longitude || "N/A"}</td>
                    </tr>
                    <tr>
                    <td>RPM</td>
                    <td className="px-2">{dataCar1?.rpm || "N/A"}</td>
                    <td className="px-2">{dataCar2?.rpm || "N/A"}</td>
                    </tr>
                    <tr>
                    <td>Velocidad</td>
                    <td className="px-2">{dataCar1?.speed || "N/A"}</td>
                    <td className="px-2">{dataCar2?.speed || "N/A"}</td>
                    </tr>
                    <tr>
                    <td>Fecha y hora</td>
                    <td className="px-2">{dataCar1?.timestamp || "N/A"}</td>
                    <td className="px-2">{dataCar2?.timestamp || "N/A"}</td>
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