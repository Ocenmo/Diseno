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

    const handleSelectRange = async (startDate, endDate) => {
        setSelectedRange({ startDate, endDate });

        const formattedStartDate = startDate.toISOString().replace("T", " ").split(".")[0];
        const formattedEndDate = endDate.toISOString().replace("T", " ").split(".")[0];

        const data = await rutas(formattedStartDate, formattedEndDate);

        if (data) {
            console.log("Datos recibidos de la API:", data);
            if (data.length > 0) {
                console.log("Ejemplo de una coordenada recibida:", data[0]);
            }

            const formattedCoordinates = data.map(coord => ({
                lat: parseFloat(coord.Latitud),
                lng: parseFloat(coord.Longitud),
                timestamp: coord.TimeStamp // Corregido con la T mayúscula
            }))
                .filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

            const formattedTimestamps = formattedCoordinates.map(({ timestamp }) =>
                timestamp ? new Date(timestamp).toLocaleString() : "Fecha no disponible"
            );
            setTimestamps(formattedTimestamps);
            console.log("Datos formateados:", formattedTimestamps);
                console.log("Datos formateados:", formattedTimestamps);


            setPath(formattedCoordinates.map(({ lat, lng }) => ({ lat, lng })));
            setCurrentIndex(0);
            setMapKey(Date.now()); // Forzar re-renderizado del mapa
        }
    };

    if (!isLoaded) return <p>Cargando mapa...</p>;

    return (
        <div>
            <h1>Historial de rutas</h1>
            <button className="buttonCalendario" onClick={() => setIsModalOpen(true)}>Seleccionar rango</button>

            {selectedRange && (
                <p>
                Fechas seleccionadas:
                {selectedRange?.startDate ? selectedRange.startDate.toLocaleString() : "No seleccionado"} -
                {selectedRange?.endDate ? selectedRange.endDate.toLocaleString() : "No seleccionado"}
                </p>
            )}

            <GoogleMap
                key={mapKey}
                zoom={15}
                center={path.length > 0 ? path[0] : { lat: 0, lng: 0 }}
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
        </div>
    );
};

export default Rutas;
