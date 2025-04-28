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

  // estados por vehículo
  const [pathCar1, setPathCar1] = useState([]);
  const [pathCar2, setPathCar2] = useState([]);
  const [tsCar1, setTsCar1] = useState([]);
  const [tsCar2, setTsCar2] = useState([]);
  const [idxCar1, setIdxCar1] = useState(0);
  const [idxCar2, setIdxCar2] = useState(0);
  const [selectedCar, setSelectedCar] = useState("both");

  const [mapKey, setMapKey] = useState(Date.now());
  const [noData, setNoData] = useState(false);

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
      .filter(p => !isNaN(p.lat) && !isNaN(p.lng));

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
      if ((selectedCar === "car1" || selectedCar === "both") && car1[0]) mapRef.current.panTo(car1[0]);
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
        {/* Controles */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
          <button
            className="px-4 py-2 bg-[#1d3557] text-white rounded-xl shadow-md"
            onClick={() => setIsModalOpen(true)}
          >
            Seleccionar Fechas
          </button>
          <select
            className="px-4 py-2 bg-white rounded-xl shadow-md"
            value={selectedCar}
            onChange={e => setSelectedCar(e.target.value)}
          >
            <option value="car1">Carro 1</option>
            <option value="car2">Carro 2</option>
            <option value="both">Ambos</option>
          </select>
        </div>

        {/* Polilíneas y marcadores */}
        {(selectedCar === "car1" || selectedCar === "both") && pathCar1.length > 0 && (
          <>
            <Polyline path={pathCar1} options={{ strokeColor: COLORS.car1, strokeWeight: 2 }} />
            {selectedCar === "car1" && <Marker position={pathCar1[idxCar1]} />}
          </>
        )}
        {(selectedCar === "car2" || selectedCar === "both") && pathCar2.length > 0 && (
          <>
            <Polyline path={pathCar2} options={{ strokeColor: COLORS.car2, strokeWeight: 2 }} />
            {selectedCar === "car2" && <Marker position={pathCar2[idxCar2]} />}
          </>
        )}
      </GoogleMap>

      {/* Tabla de datos bottom-left */}
      <div className="absolute bottom-5 left-5 z-10 bg-white p-4 border border-gray-300 rounded-xl shadow-md">
        {selectedCar === "car1" && pathCar1.length > 0 && (
          <div>
            <h3 className="font-bold mb-2">Carro 1</h3>
            <p>Latitud: {pathCar1[idxCar1].lat}</p>
            <p>Longitud: {pathCar1[idxCar1].lng}</p>
            <p>RPM: {pathCar1[idxCar1].rpm}</p>
            <p>Velocidad: {pathCar1[idxCar1].speed}</p>
            <p>Fecha y hora: {tsCar1[idxCar1]}</p>
          </div>
        )}

        {selectedCar === "car2" && pathCar2.length > 0 && (
          <div>
            <h3 className="font-bold mb-2">Carro 2</h3>
            <p>Latitud: {pathCar2[idxCar2].lat}</p>
            <p>Longitud: {pathCar2[idxCar2].lng}</p>
            <p>RPM: {pathCar2[idxCar2].rpm}</p>
            <p>Velocidad: {pathCar2[idxCar2].speed}</p>
            <p>Fecha y hora: {tsCar2[idxCar2]}</p>
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
                  <td className="px-2">{pathCar1[pathCar1.length - 1]?.lat ?? "N/A"}</td>
                  <td className="px-2">{pathCar2[pathCar2.length - 1]?.lat ?? "N/A"}</td>
                </tr>
                <tr>
                  <td>Longitud</td>
                  <td className="px-2">{pathCar1[pathCar1.length - 1]?.lng ?? "N/A"}</td>
                  <td className="px-2">{pathCar2[pathCar2.length - 1]?.lng ?? "N/A"}</td>
                </tr>
                <tr>
                  <td>RPM</td>
                  <td className="px-2">{pathCar1[pathCar1.length - 1]?.rpm ?? "N/A"}</td>
                  <td className="px-2">{pathCar2[pathCar2.length - 1]?.rpm ?? "N/A"}</td>
                </tr>
                <tr>
                  <td>Velocidad</td>
                  <td className="px-2">{pathCar1[pathCar1.length - 1]?.speed ?? "N/A"}</td>
                  <td className="px-2">{pathCar2[pathCar2.length - 1]?.speed ?? "N/A"}</td>
                </tr>
                <tr>
                  <td>Fecha y hora</td>
                  <td className="px-2">{tsCar1[tsCar1.length - 1] ?? "N/A"}</td>
                  <td className="px-2">{tsCar2[tsCar2.length - 1] ?? "N/A"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sliders para cada vehículo */}
      {(selectedCar === "car1" || selectedCar === "both") && pathCar1.length > 1 && (
        <div className="absolute w-full max-w-[90%] md:max-w-md h-fit bottom-40 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center justify-center border border-black rounded-[99px] bg-[#14213d] text-white shadow-[0_4px_8px_#081c15] px-4 py-3 overflow-hidden text-wrap break-words">
          <input
            className="w-full mb-3 accent-yellow-400"
            type="range"
            min="0"
            max={pathCar1.length - 1}
            value={idxCar1}
            onChange={e => setIdxCar1(Number(e.target.value))}
          />
        </div>
      )}

{(selectedCar === "car2" || selectedCar === "both") && pathCar2.length > 1 && (
        <div className="absolute w-full max-w-[90%] md:max-w-md h-fit bottom-32 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center justify-center border border-black rounded-[99px] bg-[#14213d] text-white shadow-[0_4px_8px_#081c15] px-4 py-3 overflow-hidden text-wrap break-words">
          <input
            className="w-full mb-3 accent-red-500"
            type="range"
            min="0"
            max={pathCar2.length - 1}
            value={idxCar2}
            onChange={e => setIdxCar2(Number(e.target.value))}
          />
        </div>
      )}

      {/* Modal de selección de fechas */}
      {isModalOpen && (
        <DateRangeModal
          onClose={() => setIsModalOpen(false)}
          onSelectRange={handleSelectRange}
        />
      )}

      {/* Mensaje de no hay datos */}
      {noData && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-red-400 text-red-700 px-6 py-4 rounded-xl shadow-md z-50">
          No se encontraron datos para el rango seleccionado.
        </div>
      )}
    </div>
  );
};

export default Rutas;

