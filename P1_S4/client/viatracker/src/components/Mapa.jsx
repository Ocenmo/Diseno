import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";

const Map = ({ positionCar1, positionCar2, pathCar1, pathCar2, selectedCar, onSelectedCarChange }) => {
    const getCenter = () => {
        if (selectedCar === "car1" && positionCar1) return positionCar1;
        if (selectedCar === "car2" && positionCar2) return positionCar2;
        if (selectedCar === "both" && positionCar1 && positionCar2) {
            return {
                lat: (positionCar1.lat + positionCar2.lat) / 2,
                lng: (positionCar1.lng + positionCar2.lng) / 2,
            };
        }
        return { lat: 11.022092, lng: -74.851364 }; // Centro por defecto
    };

    return (
        <div className="flex-1 relative h-screen">
            <GoogleMap
                className="w-full h-full rounded-xl shadow-lg"
                options={{ disableDefaultUI: true, zoomControl: true }}
                zoom={15}
                center={getCenter()}
                mapContainerStyle={{ width: "100%", height: "100%" }}
            >
                {/* Botón de selección */}
                <div className="absolute top-12 right-4 z-10">
                    <select
                        value={selectedCar}
                        onChange={(e) => onSelectedCarChange(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base w-32 sm:w-40"
                    >
                        <option value="car1">Carro 1</option>
                        <option value="car2">Carro 2</option>
                        <option value="both">Ambos</option>
                    </select>
                </div>

                {/* Marcadores y polilíneas */}
                {selectedCar !== "car2" && positionCar1 && (
                    <>
                        <Marker position={positionCar1} icon={{ url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png" }} />
                        {pathCar1.length > 1 && (
                            <Polyline
                                path={pathCar1}
                                options={{ strokeColor: "#2d6a4f", strokeOpacity: 1, strokeWeight: 2 }}
                            />
                        )}
                    </>
                )}

                {selectedCar !== "car1" && positionCar2 && (
                    <>
                        <Marker position={positionCar2} icon={{ url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" }} />
                        {pathCar2.length > 1 && (
                            <Polyline
                                path={pathCar2}
                                options={{ strokeColor: "#b56576", strokeOpacity: 1, strokeWeight: 2 }}
                            />
                        )}
                    </>
                )}
            </GoogleMap>

            {/* Tabla dinámica */}
            <div className="absolute bottom-16 left-4 z-10 bg-white p-4 border border-gray-300 rounded-xl shadow-md max-w-[90%] sm:max-w-md max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
                {selectedCar === "car1" && positionCar1 && (
                    <div>
                        <h3 className="font-bold mb-2 text-sm sm:text-base">Carro 1</h3>
                        <p className="text-xs sm:text-sm">Latitud: {positionCar1.lat}</p>
                        <p className="text-xs sm:text-sm">Longitud: {positionCar1.lng}</p>
                        <p className="text-xs sm:text-sm">RPM: {positionCar1.rpm !== undefined ? positionCar1.rpm : "No disponible"}</p>
                        <p className="text-xs sm:text-sm">Velocidad: {positionCar1.speed !== undefined ? positionCar1.speed : "No disponible"}</p>
                        <p className="text-xs sm:text-sm">Fecha y hora: {positionCar1.timestamp}</p>
                    </div>
                )}

                {selectedCar === "car2" && positionCar2 && (
                    <div>
                        <h3 className="font-bold mb-2 text-sm sm:text-base">Carro 2</h3>
                        <p className="text-xs sm:text-sm">Latitud: {positionCar2.lat}</p>
                        <p className="text-xs sm:text-sm">Longitud: {positionCar2.lng}</p>
                        <p className="text-xs sm:text-sm">RPM: {positionCar2.rpm !== undefined ? positionCar2.rpm : "No disponible"}</p>
                        <p className="text-xs sm:text-sm">Velocidad: {positionCar2.speed !== undefined ? positionCar2.speed : "No disponible"}</p>
                        <p className="text-xs sm:text-sm">Fecha y hora: {positionCar2.timestamp}</p>
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
                                    <td className="px-2">{positionCar1 ? positionCar1.lat : "N/A"}</td>
                                    <td className="px-2">{positionCar2 ? positionCar2.lat : "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="px-2">Longitud</td>
                                    <td className="px-2">{positionCar1 ? positionCar1.lng : "N/A"}</td>
                                    <td className="px-2">{positionCar2 ? positionCar2.lng : "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="px-2">RPM</td>
                                    <td className="px-2">{positionCar1 ? positionCar1.rpm : "N/A"}</td>
                                    <td className="px-2">{positionCar2 ? positionCar2.rpm : "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="px-2">Velocidad</td>
                                    <td className="px-2">{positionCar1 ? positionCar1.speed : "N/A"}</td>
                                    <td className="px-2">{positionCar2 ? positionCar2.speed : "N/A"}</td>
                                </tr>
                                <tr>
                                    <td className="px-2">Fecha y hora</td>
                                    <td className="px-2">{positionCar1 ? positionCar1.timestamp : "N/A"}</td>
                                    <td className="px-2">{positionCar2 ? positionCar2.timestamp : "N/A"}</td>
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