import React from "react";
import "./Table.css"

const Table = ({ data, error }) => {
    return (
        <div>
            <h1>Último Dato Recibido</h1>
            {error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : data.length > 0 ? (
                <table border="1" style={{ width: "100%", textAlign: "left" }}>
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
            ) : (
                <p>Cargando datos...</p>
            )}
        </div>
    );
};

export default Table;