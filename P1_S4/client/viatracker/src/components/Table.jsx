import React from "react";
import "./Table.css";

const Table = ({ data, error }) => {
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
                                <th>Speed</th>
                                <th>RPM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr
                                    className="flex justify-between w-full gap-12 items-center border-b border-gray-300 ml-5"
                                    key={index}
                                >
                                    <td>{item.id}</td>
                                    <td>{item.latitude}</td>
                                    <td>{item.longitude}</td>
                                    <td>{item.timestamp}</td>
                                    <td>{item.speed}</td>
                                    <td>{item.rpm}</td>
                                </tr>
                            ))}
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
