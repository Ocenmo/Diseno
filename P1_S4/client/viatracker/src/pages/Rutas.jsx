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
    const [lastPosition, setLastPosition] = useState(null);
    const [mapKey, setMapKey] = useState(Date.now());

    const handleSelectRange = async (startDate, endDate) => {
        setSelectedRange({ startDate, endDate });

        const formattedStartDate = startDate.toISOString().split("T")[0] + " 00:00:00";
        const formattedEndDate = endDate.toISOString().split("T")[0] + " 23:59:59";

        const data = await rutas(formattedStartDate, formattedEndDate);

        if (data) {
            const formattedCoordinates = data
                .map(coord => ({
                    lat: parseFloat(coord.Latitud),
                    lng: parseFloat(coord.Longitud),
                }))
                .filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

            setPath(formattedCoordinates);
            setLastPosition(formattedCoordinates.length > 0 ? formattedCoordinates[formattedCoordinates.length - 1] : null);
            setMapKey(Date.now()); // Forzar re-renderizado del mapa
        }
    };

    if (!isLoaded) return <p>Cargando mapa...</p>;

    return (
        <div>
            <h1>Historial de rutas</h1>
            <button onClick={() => setIsModalOpen(true)}>Seleccionar rango</button>

            {selectedRange && (
                <p>Fechas seleccionadas: {selectedRange.startDate.toDateString()} - {selectedRange.endDate.toDateString()}</p>
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

                {lastPosition && (
                    <Marker position={lastPosition} />
                )}
            </GoogleMap>

            <DateRangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectRange={handleSelectRange} />
        </div>
    );
};

export default Rutas;


//Funciona