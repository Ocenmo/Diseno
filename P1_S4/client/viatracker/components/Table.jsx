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
                        <tr>
                            <td>{data[0].id}</td>
                            <td>{data[0].Latitud}</td>
                            <td>{data[0].Longitud}</td>
                            <td>{data[0].Timestamp}</td>
                        </tr>
                    </tbody>
                </table>
            ) : (
                <p>Cargando datos...</p>
            )}
        </div>
    );
};

export default Table;
