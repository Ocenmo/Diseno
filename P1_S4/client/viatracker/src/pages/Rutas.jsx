import React, { useState, useEffect } from "react";
import DateRangeModal from "../components/DateRangeSidebar";
import { GoogleMap, Polyline, Marker } from "@react-google-maps/api";
import { rutas } from "../services/api";
import "./Rutas.css";

const Rutas = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [pathCar1, setPathCar1] = useState([]);
  const [pathCar2, setPathCar2] = useState([]);
  const [timestampsCar1, setTimestampsCar1] = useState([]);
  const [timestampsCar2, setTimestampsCar2] = useState([]);
  const [allTimestamps, setAllTimestamps] = useState([]);
  const [currentIndexCar1, setCurrentIndexCar1] = useState(0);
  const [currentIndexCar2, setCurrentIndexCar2] = useState(0);
  const [currentIndexBoth, setCurrentIndexBoth] = useState(0);
  const [mapKey, setMapKey] = useState(Date.now());
  const [noData, setNoData] = useState(false);
  const [selectedCar, setSelectedCar] = useState("both");

  const iconCar1 = {
    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
  };

  const iconCar2 = {
    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  };

  const handleSelectRange = async (startDate, endDate) => {
    setSelectedRange({ startDate, endDate });

    const formattedStartDate = startDate.toISOString().split("T")[0] + " 00:00:00";
    const formattedEndDate = endDate.toISOString().split("T")[0] + " 23:59:59";

    const data = await rutas(formattedStartDate, formattedEndDate);

    if (data && data.length > 0) {
      setNoData(false);
      console.log("Datos recibidos de la API:", data);

      const processData = (carId) => {
        return data
          .filter((coord) => coord.carId === carId)
          .map((coord) => ({
            lat: parseFloat(coord.Latitud),
            lng: parseFloat(coord.Longitud),
            timestamp: new Date(coord.TimeStamp),
            rpm: Number(coord.rpm) || 0,
            speed: parseFloat(coord.speed) || 0,
          }))
          .filter((coord) => !isNaN(coord.lat) && !isNaN(coord.lng))
          .sort((a, b) => a.timestamp - b.timestamp);
      };

      const filteredCar1 = processData("car1");
      const filteredCar2 = processData("car2");

      setPathCar1(filteredCar1);
      setPathCar2(filteredCar2);

      const allTimestampsSet = new Set([
        ...filteredCar1.map((p) => p.timestamp.toISOString()),
        ...filteredCar2.map((p) => p.timestamp.toISOString()),
      ]);
      const sortedTimestamps = Array.from(allTimestampsSet)
        .map((ts) => new Date(ts))
        .sort((a, b) => a - b);
      setAllTimestamps(sortedTimestamps);

      const timestampsCar1 = filteredCar1.map(({ timestamp }) =>
        timestamp ? timestamp.toLocaleString("es-CO", { timeZone: "UTC" }) : "Fecha no disponible"
      );
      const timestampsCar2 = filteredCar2.map(({ timestamp }) =>
        timestamp ? timestamp.toLocaleString("es-CO", { timeZone: "UTC" }) : "Fecha no disponible"
      );

      setTimestampsCar1(timestampsCar1);
      setTimestampsCar2(timestampsCar2);
      setCurrentIndexCar1(0);
      setCurrentIndexCar2(0);
      setCurrentIndexBoth(0);
      setMapKey(Date.now());
    } else {
      setNoData(true);
    }
  };

  const findClosestIndex = (path, selectedTimestamp) => {
    if (path.length === 0) return -1;
    let index = path.findIndex((p) => p.timestamp > selectedTimestamp);
    if (index === 0) return 0;
    if (index === -1) return path.length - 1;
    return index - 1;
  };

  const selectedTimestamp = selectedCar === "both" && allTimestamps.length > 0 ? allTimestamps[currentIndexBoth] : null;
  const indexCar1Both = selectedTimestamp ? findClosestIndex(pathCar1, selectedTimestamp) : -1;
  const indexCar2Both = selectedTimestamp ? findClosestIndex(pathCar2, selectedTimestamp) : -1;

  const indexCar1 = selectedCar === "both" ? indexCar1Both : currentIndexCar1;
  const indexCar2 = selectedCar === "both" ? indexCar2Both : currentIndexCar2;

  return (
    <div className="flex-1 relative h-screen">
      <GoogleMap
        className="w-full h-full rounded-xl shadow-lg"
        options={{ disableDefaultUI: true, zoomControl: true }}
        key={mapKey}
        zoom={15}
        center={
          selectedCar === "car1" && indexCar1 >= 0
            ? pathCar1[indexCar1]
            : selectedCar === "car2" && indexCar2 >= 0
            ? pathCar2[indexCar2]
            : selectedCar === "both" && indexCar1Both >= 0 && indexCar2Both >= 0
            ? {
                lat: (pathCar1[indexCar1Both].lat + pathCar2[indexCar2Both].lat) / 2,
                lng: (pathCar1[indexCar1Both].lng + pathCar2[indexCar2Both].lng) / 2,
              }
            : { lat: 11.020082, lng: -74.850364 }
        }
        mapContainerStyle={{ width: "100%", height: "100%" }}
      >
        <div className="absolute top-8 right-4 z-10 sm:top-10 sm:right-6">
          <button
            className="px-4 py-2 bg-[#1d3557] text-white border-2 border-[#a8dadc] rounded-xl shadow-md hover:bg-[#a8dadc] hover:scale-105 transition-all duration-300 text-sm sm:text-base"
            onClick={() => setIsModalOpen(true)}
          >
            Seleccionar rango de fechas
          </button>
        </div>

        <div className="absolute top-20 right-4 z-10 sm:top-24 sm:right-6">
          <select
            value={selectedCar}
            onChange={(e) => setSelectedCar(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base w-32 sm:w-40"
          >
            <option value="car1">Carro 1</option>
            <option value="car2">Carro 2</option>
            <option value="both">Ambos</option>
          </select>
        </div>

        {(selectedCar === "car1" || selectedCar === "both") && pathCar1.length > 1 && (
          <Polyline
            path={pathCar1}
            options={{
              strokeColor: "#2d6a4f",
              strokeOpacity: 1,
              strokeWeight: 2,
            }}
          />
        )}

        {(selectedCar === "car2" || selectedCar === "both") && pathCar2.length > 1 && (
          <Polyline
            path={pathCar2}
            options={{
              strokeColor: "#b56576",
              strokeOpacity: 1,
              strokeWeight: 2,
            }}
          />
        )}

        {(selectedCar === "car1" || selectedCar === "both") && indexCar1 >= 0 && (
          <Marker position={pathCar1[indexCar1]} icon={iconCar1} />
        )}

        {(selectedCar === "car2" || selectedCar === "both") && indexCar2 >= 0 && (
          <Marker position={pathCar2[indexCar2]} icon={iconCar2} />
        )}
      </GoogleMap>

      <div className="absolute bottom-16 left-4 z-10 bg-white p-4 border border-gray-300 rounded-xl shadow-md max-w-[90%] sm:max-w-md max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
        {selectedCar === "car1" && indexCar1 >= 0 && (
          <div>
            <h3 className="font-bold mb-2 text-sm sm:text-base">Carro 1</h3>
            <p className="text-xs sm:text-sm">Latitud: {pathCar1[indexCar1].lat}</p>
            <p className="text-xs sm:text-sm">Longitud: {pathCar1[indexCar1].lng}</p>
            <p className="text-xs sm:text-sm">RPM: {pathCar1[indexCar1].rpm}</p>
            <p className="text-xs sm:text-sm">Velocidad: {pathCar1[indexCar1].speed}</p>
            <p className="text-xs sm:text-sm">Fecha y hora: {timestampsCar1[indexCar1]}</p>
          </div>
        )}

        {selectedCar === "car2" && indexCar2 >= 0 && (
          <div>
            <h3 className="font-bold mb-2 text-sm sm:text-base">Carro 2</h3>
            <p className="text-xs sm:text-sm">Latitud: {pathCar2[indexCar2].lat}</p>
            <p className="text-xs sm:text-sm">Longitud: {pathCar2[indexCar2].lng}</p>
            <p className="text-xs sm:text-sm">RPM: {pathCar2[indexCar2].rpm}</p>
            <p className="text-xs sm:text-sm">Velocidad: {pathCar2[indexCar2].speed}</p>
            <p className="text-xs sm:text-sm">Fecha y hora: {timestampsCar2[indexCar2]}</p>
          </div>
        )}

        {selectedCar === "both" && (
          <div>
            <h3 className="font-bold mb-2 text-sm sm:text-base">Datos de los carros</h3>
            <table className="table-auto text-xs sm:text-sm w-full">
              <thead>
                <tr>
                  <th className="px-2"></th>
                  <th className="px-2">Carro 1</th>
                  <th className="px-2">Carro 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2">Latitud</td>
                  <td className="px-2">{indexCar1Both >= 0 ? pathCar1[indexCar1Both].lat : "N/A"}</td>
                  <td className="px-2">{indexCar2Both >= 0 ? pathCar2[indexCar2Both].lat : "N/A"}</td>
                </tr>
                <tr>
                  <td className="px-2">Longitud</td>
                  <td className="px-2">{indexCar1Both >= 0 ? pathCar1[indexCar1Both].lng : "N/A"}</td>
                  <td className="px-2">{indexCar2Both >= 0 ? pathCar2[indexCar2Both].lng : "N/A"}</td>
                </tr>
                <tr>
                  <td className="px-2">RPM</td>
                  <td className="px-2">{indexCar1Both >= 0 ? pathCar1[indexCar1Both].rpm : "N/A"}</td>
                  <td className="px-2">{indexCar2Both >= 0 ? pathCar2[indexCar2Both].rpm : "N/A"}</td>
                </tr>
                <tr>
                  <td className="px-2">Velocidad</td>
                  <td className="px-2">{indexCar1Both >= 0 ? pathCar1[indexCar1Both].speed : "N/A"}</td>
                  <td className="px-2">{indexCar2Both >= 0 ? pathCar2[indexCar2Both].speed : "N/A"}</td>
                </tr>
                <tr>
                  <td className="px-2">Fecha y hora</td>
                  <td className="px-2">{indexCar1Both >= 0 ? timestampsCar1[indexCar1Both] : "N/A"}</td>
                  <td className="px-2">{indexCar2Both >= 0 ? timestampsCar2[indexCar2Both] : "N/A"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCar === "car1" && pathCar1.length > 1 && (
        <div className="absolute w-full max-w-[90%] sm:max-w-md bottom-20 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center bg-[#14213d] text-white border border-black rounded-full shadow-lg px-4 py-3">
          <input
            className="w-full accent-yellow-400"
            type="range"
            min="0"
            max={pathCar1.length - 1}
            value={currentIndexCar1}
            onChange={(e) => setCurrentIndexCar1(Number(e.target.value))}
          />
        </div>
      )}

      {selectedCar === "car2" && pathCar2.length > 1 && (
        <div className="absolute w-full max-w-[90%] sm:max-w-md bottom-20 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center bg-[#14213d] text-white border border-black rounded-full shadow-lg px-4 py-3">
          <input
            className="w-full accent-yellow-400"
            type="range"
            min="0"
            max={pathCar2.length - 1}
            value={currentIndexCar2}
            onChange={(e) => setCurrentIndexCar2(Number(e.target.value))}
          />
        </div>
      )}

      {selectedCar === "both" && allTimestamps.length > 1 && (
        <div className="absolute w-full max-w-[90%] sm:max-w-md bottom-20 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center bg-[#14213d] text-white border border-black rounded-full shadow-lg px-4 py-3">
          <input
            className="w-full accent-yellow-400"
            type="range"
            min="0"
            max={allTimestamps.length - 1}
            value={currentIndexBoth}
            onChange={(e) => setCurrentIndexBoth(Number(e.target.value))}
          />
        </div>
      )}

      <DateRangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectRange={handleSelectRange} />

      {noData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">No hubo movimiento en el rango seleccionado</h2>
            <button
              onClick={() => setNoData(false)}
              className="px-4 py-2 bg-[#1d3557] text-white rounded-xl hover:bg-[#a8dadc] transition-all duration-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rutas;