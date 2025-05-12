import React from "react";
import moment from "moment-timezone";

const Table = ({ data, selectedCar, error }) => {
    console.log("Datos recibidos en Table.jsx:", data);

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    if (data.length === 0) {
        return <p>Cargando datos...</p>;
    }

    // Función para obtener el dato más reciente de un carro
    const getLatestData = (carId) => {
        const carData = data.filter(item => item.carId === carId);
        return carData.length > 0 ? carData[carData.length - 1] : null;
    };

    // Función para formatear el timestamp
    const formatTimestamp = (timestamp) => {
        return timestamp
            ? moment.utc(timestamp).tz('America/Bogota', true).format('YYYY-MM-DD HH:mm:ss')
            : "N/A";
    };

    // Si se selecciona un solo carro
    if (selectedCar === "car1" || selectedCar === "car2") {
        const carData = getLatestData(selectedCar);
        if (!carData) {
            return <p>No hay datos para {selectedCar}</p>;
        }
        const localTimestamp = formatTimestamp(carData.timestamp);
        return (
            <div className="absolute bottom-16 left-4 z-10 bg-white p-4 border border-gray-300 rounded-xl shadow-md max-w-[90%] sm:max-w-md max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
                <h3 className="font-bold mb-2 text-sm sm:text-base">{selectedCar === "car1" ? "Carro 1" : "Carro 2"}</h3>
                <p className="text-xs sm:text-sm">Latitud: {carData.latitude}</p>
                <p className="text-xs sm:text-sm">Longitud: {carData.longitude}</p>
                <p className="text-xs sm:text-sm">RPM: {carData.rpm !== undefined ? carData.rpm : "No disponible"}</p>
                <p className="text-xs sm:text-sm">Velocidad: {carData.speed !== undefined ? carData.speed : "No disponible"}</p>
                <p className="text-xs sm:text-sm">Fecha y hora: {localTimestamp}</p>
            </div>
        );
    }

    // Si se selecciona "both"
    if (selectedCar === "both") {
        const car1Data = getLatestData("car1");
        const car2Data = getLatestData("car2");
        const timestampCar1 = car1Data ? formatTimestamp(car1Data.timestamp) : "N/A";
        const timestampCar2 = car2Data ? formatTimestamp(car2Data.timestamp) : "N/A";
        return (
            <div className="absolute bottom-16 left-4 z-10 bg-white p-4 border border-gray-300 rounded-xl shadow-md max-w-[90%] sm:max-w-md max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
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
                            <td className="px-2">{car1Data ? car1Data.latitude : "N/A"}</td>
                            <td className="px-2">{car2Data ? car2Data.latitude : "N/A"}</td>
                        </tr>
                        <tr>
                            <td className="px-2">Longitud</td>
                            <td className="px-2">{car1Data ? car1Data.longitude : "N/A"}</td>
                            <td className="px-2">{car2Data ? car2Data.longitude : "N/A"}</td>
                        </tr>
                        <tr>
                            <td className="px-2">RPM</td>
                            <td className="px-2">{car1Data && car1Data.rpm !== undefined ? car1Data.rpm : "N/A"}</td>
                            <td className="px-2">{car2Data && car2Data.rpm !== undefined ? car2Data.rpm : "N/A"}</td>
                        </tr>
                        <tr>
                            <td className="px-2">Velocidad</td>
                            <td className="px-2">{car1Data && car1Data.speed !== undefined ? car1Data.speed : "N/A"}</td>
                            <td className="px-2">{car2Data && car2Data.speed !== undefined ? car2Data.speed : "N/A"}</td>
                        </tr>
                        <tr>
                            <td className="px-2">Fecha y hora</td>
                            <td className="px-2">{timestampCar1}</td>
                            <td className="px-2">{timestampCar2}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return null; // En caso de que selectedCar no sea "car1", "car2" o "both"
};

export default Table;