import React from "react";
import moment from "moment-timezone"; // Asegúrate de que esté importado

const Table = ({ data, error }) => {
    console.log("Datos recibidos en Table.jsx:", data);

    return (
        <div className="table-container">
            {error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : data.length > 0 ? (
                <div className={`scrollable-table ${data.length > 6 ? "scroll" : ""}`}>
                    <table className="block justify-between w-[105%] gap-4 my-8 p-4 border border-black rounded-[99px] bg-[#14213d] shadow-[0_4px_8px_#081c15] transition-transform duration-300 ease-in-out text-white">
                        <thead>
                            <tr className="flex justify-between w-full gap-12 items-center border-b border-gray-300 ml-5">
                                <th>ID</th>
                                <th>Latitud</th>
                                <th>Longitud</th>
                                <th>Timestamp</th>
                                <th>Speed (km/h)</th>
                                <th>RPM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => {
                                // Asegúrate de que el timestamp es tratado como UTC antes de convertirlo a la zona horaria de Bogotá
                                const localTimestamp = moment.utc(item.timestamp) // Asegúrate de que se trata como UTC
                                    .tz('America/Bogota', true) // Se convierte a Bogotá
                                    .format('YYYY-MM-DD HH:mm:ss'); // Formato final

                                console.log("Timestamp local:", localTimestamp); // Ver el timestamp local

                                return (
                                    <tr
                                        className="flex justify-between w-full gap-12 items-center border-b border-gray-300 ml-5"
                                        key={index}
                                    >
                                        <td>{item.id}</td>
                                        <td>{item.latitude}</td>
                                        <td>{item.longitude}</td>
                                        <td>{localTimestamp}</td> {/* Aquí usas el timestamp convertido */}
                                        <td>{item.speed !== undefined ? item.speed : "No disponible"}</td>
                                        <td>{item.rpm !== undefined ? item.rpm : "No disponible"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>Cargando datos...</p>
            )}
        </div>
    );
};

export default Table;
