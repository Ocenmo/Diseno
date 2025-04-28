import React, { useState, useRef } from "react";
import DateRangeModal from "../components/DateRangeSidebar";
import { GoogleMap, Polyline, Marker } from "@react-google-maps/api";
import { rutas } from "../services/api";
import "./Rutas.css";

const COLORS = { car1: "#2d6a4f", car2: "#ff5733" };
const initialCenter = { lat: 11.020082, lng: -74.850364 };

const Rutas = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [pathCar1, setPathCar1] = useState([]);
  const [pathCar2, setPathCar2] = useState([]);
  const [tsCar1, setTsCar1] = useState([]);
  const [tsCar2, setTsCar2] = useState([]);
  const [idxCar1, setIdxCar1] = useState(0);
  const [idxCar2, setIdxCar2] = useState(0);
  const [mapKey, setMapKey] = useState(Date.now());
  const [noData, setNoData] = useState(false);
  const [selectedCar, setSelectedCar] = useState("both");

  const mapRef = useRef(null);

  const processData = (data, carId) =>
    data
      .filter(c => c.carId === carId)
      .map(coord => ({
        lat: parseFloat(coord.Latitud),
        lng: parseFloat(coord.Longitud),
        timestamp: coord.TimeStamp,
        rpm: Number(coord.rpm),
        speed: parseFloat(coord.speed)
      }))
      .filter(pt => !isNaN(pt.lat) && !isNaN(pt.lng));

  const handleSelectRange = async (startDate, endDate) => {
    setSelectedRange({ startDate, endDate });
    const fmt = d => d.toISOString().split("T")[0];
    const data = await rutas(
      `${fmt(startDate)} 00:00:00`,
      `${fmt(endDate)} 23:59:59`
    );

    if (data && data.length > 0) {
      setNoData(false);
      const car1 = processData(data, "car1");
      const car2 = processData(data, "car2");
      setPathCar1(car1);
      setPathCar2(car2);
      setTsCar1(car1.map(p => new Date(p.timestamp).toLocaleString("es-CO", { timeZone: "UTC" })));
      setTsCar2(car2.map(p => new Date(p.timestamp).toLocaleString("es-CO", { timeZone: "UTC" })));
      setIdxCar1(0);
      setIdxCar2(0);
      setMapKey(Date.now());
      if (selectedCar === "car1" && car1[0]) mapRef.current.panTo(car1[0]);
      if (selectedCar === "car2" && car2[0]) mapRef.current.panTo(car2[0]);
    } else {
      setNoData(true);
    }
  };

  return (
    <div className="flex-1 relative">
      <GoogleMap
        key={mapKey}
        zoom={15}
        center={
          selectedCar === "car1"
            ? pathCar1[idxCar1] || initialCenter
            : selectedCar === "car2"
            ? pathCar2[idxCar2] || initialCenter
            : initialCenter
        }
        mapContainerStyle={{ width: "100%", height: "calc(100vh - 60px)" }}
        options={{ disableDefaultUI: true, zoomControl: true }}
        onLoad={map => (mapRef.current = map)}
      >
        {/* Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
          <button
            className="px-4 py-2 bg-blue-800 text-white rounded-xl"
            onClick={() => setIsModalOpen(true)}
          >
            Seleccionar Fechas
          </button>
          <select
            className="px-4 py-2 bg-white rounded-xl"
            value={selectedCar}
            onChange={e => setSelectedCar(e.target.value)}
          >
            <option value="car1">Carro 1</option>
            <option value="car2">Carro 2</option>
            <option value="both">Ambos</option>
          </select>
        </div>

        {/* Polylines & markers */}
        {(selectedCar === "car1" || selectedCar === "both") && (
          <>
            <Polyline path={pathCar1} options={{ strokeColor: COLORS.car1, strokeWeight: 2 }} />
            <Marker position={pathCar1[idxCar1]} />
          </>
        )}
        {(selectedCar === "car2" || selectedCar === "both") && (
          <>
            <Polyline path={pathCar2} options={{ strokeColor: COLORS.car2, strokeWeight: 2 }} />
            <Marker position={pathCar2[idxCar2]} />
          </>
        )}
      </GoogleMap>

      {/* Data table bottom-left */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-xl shadow-lg">
        <table className="text-sm">
          <thead>
            <tr>
              <th></th>
              {selectedCar !== "car2" && <th>Carro 1</th>}
              {selectedCar !== "car1" && <th>Carro 2</th>}
            </tr>
          </thead>
          <tbody>
            {['Latitud','Longitud','RPM','Speed','Timestamp'].map(field => (
              <tr key={field}>
                <td className="font-semibold pr-4">{field}</td>
                {selectedCar !== "car2" && (
                  <td className="pr-4">
                    {pathCar1[idxCar1]?.[field.toLowerCase()] || '-'}
                  </td>
                )}
                {selectedCar !== "car1" && (
                  <td>
                    {selectedCar === "both"
                      ? pathCar2[idxCar2]?.[field.toLowerCase()] || '-'
                      : pathCar2[idxCar2]?.[field.toLowerCase()] || '-'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sliders */}
      {selectedCar !== "car2" && pathCar1.length > 1 && (
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2">
          <input
            type="range"
            min="0"
            max={pathCar1.length - 1}
            value={idxCar1}
            onChange={e => setIdxCar1(Number(e.target.value))}
          />
        </div>
      )}
      {selectedCar !== "car1" && pathCar2.length > 1 && (
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2">
          <input
            type="range"
            min="0"
            max={pathCar2.length - 1}
            value={idxCar2}
            onChange={e => setIdxCar2(Number(e.target.value))}
          />
        </div>
      )}

      <DateRangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectRange={handleSelectRange} />
      {noData && (
        <div className="modal-overlay"><div className="modal-content"><h2>No hay datos</h2><button onClick={() => setNoData(false)}>Cerrar</button></div></div>
      )}
    </div>
  );
};

export default Rutas;
