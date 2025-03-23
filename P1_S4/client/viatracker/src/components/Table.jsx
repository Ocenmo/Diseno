import React from "react";
import "./Table.css";

const Table = ({ data, error }) => {
    return (
        <div className="table-container">
            {error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : data.length > 0 ? (
                <div className={`scrollable-table ${data.length > 6 ? "scroll" : ""}`}>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Latitud</th>
                                <th>Longitud</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.id}</td>
                                    <td>{item.latitude}</td>
                                    <td>{item.longitude}</td>
                                    <td>{item.timestamp}</td>
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
