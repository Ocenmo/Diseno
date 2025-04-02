import React, { useState } from "react";
import DateRangeModal from "../components/DateRangeSidebar";
import { GoogleMap, Polyline, Marker, useLoadScript } from "@react-google-maps/api";
import { rutas } from "../services/api";
import "./Rutas.css";

const ApiKey = import.meta.env.VITE_API_KEY;

const Rutas = () => {
    const { isLoaded } = useLoadScript({ googleMapsApiKey: ApiKey });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);
    const [path, setPath] = useState([]);
    const [timestamps, setTimestamps] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mapKey, setMapKey] = useState(Date.now());
    const [noData, setNoData] = useState(false); // Estado para indicar si no hay datos

    const handleSelectRange = async (startDate, endDate) => {
        setSelectedRange({ startDate, endDate });

        const formattedStartDate = startDate.toISOString().split("T")[0] + " 00:00:00";
        const formattedEndDate = endDate.toISOString().split("T")[0] + " 23:59:59";

        const data = await rutas(formattedStartDate, formattedEndDate);

        if (data && data.length > 0) {
            setNoData(false); // Resetear si hay datos
            console.log("Datos recibidos de la API:", data);
            const formattedCoordinates = data.map(coord => ({
                lat: parseFloat(coord.Latitud),
                lng: parseFloat(coord.Longitud),
                timestamp: coord.TimeStamp
            }))
                .filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

            const formattedTimestamps = formattedCoordinates.map(({ timestamp }) =>
                timestamp ? new Date(timestamp).toLocaleString() : "Fecha no disponible"
            );
            setTimestamps(formattedTimestamps);

            setPath(formattedCoordinates.map(({ lat, lng }) => ({ lat, lng })));
            setCurrentIndex(0);
            setMapKey(Date.now()); // Forzar re-renderizado del mapa
        } else {
            setNoData(true); // Indicar que no hay datos
        }
    };

    if (!isLoaded) return <p>Cargando mapa...</p>;

    return (
        <div>
            <h1>Historial de rutas</h1>
            <button className="buttonCalendario" onClick={() => setIsModalOpen(true)}>Seleccionar rango</button>

            {selectedRange && (
                <p>Fechas seleccionadas: {selectedRange.startDate.toDateString()} - {selectedRange.endDate.toDateString()}</p>
            )}

            <GoogleMap
                key={mapKey}
                zoom={15}
                center={path.length > 0 ? path[0] : { lat: 11.020082, lng: -74.850364 }}
                mapContainerStyle={{ width: "100%", height: "500px" }}
            >
                {path.length > 1 && (
                    <Polyline
                        path={path}
                        options={{ strokeColor: "#ff5733", strokeOpacity: 1, strokeWeight: 2 }}
                    />
                )}

                {path.length > 0 && (
                    <Marker position={path[currentIndex]} />
                )}
            </GoogleMap>

            {path.length > 1 && (
                <div className="slider-container">
                    <input className="slider"
                        type="range"
                        min="0"
                        max={path.length - 1}
                        value={currentIndex}
                        onChange={(e) => setCurrentIndex(Number(e.target.value))}
                    />
                    <div>
                        <p>{path[currentIndex] ? `Latitud: ${path[currentIndex].lat}` : ""}</p>
                        <p>{path[currentIndex] ? `Longitud: ${path[currentIndex].lng}` : ""}</p>
                        <p>{timestamps[currentIndex] ? `Fecha y hora: ${timestamps[currentIndex]}` : ""}</p>
                    </div>
                </div>
            )}

            <DateRangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectRange={handleSelectRange} />

            {/* Modal de No Data */}
            {noData && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>No hubo movimiento en el rango seleccionado</h2>
                        <button onClick={() => setNoData(false)} className="close-button">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rutas;
