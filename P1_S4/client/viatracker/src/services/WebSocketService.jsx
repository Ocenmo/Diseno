export const connectWebSocket = (setDataCallback) => {
    const wsUrl = import.meta.env.VITE_WS_URL;
    let ws;

    const connect = () => {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Conexión WebSocket establecida");
        };

        ws.onmessage = (event) => {
            try {
                const newData = JSON.parse(event.data);
                console.log("Datos crudos del WebSocket:", newData); // Log detallado

                if (isValidCoordinate(newData.latitude, newData.longitude)) {
                    setDataCallback(newData);
                } else {
                    console.warn("Coordenadas inválidas:", newData.latitude, newData.longitude);
                }
            } catch (err) {
                console.error("Error procesando mensaje WebSocket:", err);
            }
        };

        ws.onerror = (err) => console.error("Error en WebSocket:", err);
        ws.onclose = () => {
            console.warn("Conexión WebSocket cerrada");
        };
    };
    connect();
    return ws;
};

function isValidCoordinate(lat, lng) {
    return typeof lat === "number" && typeof lng === "number" &&
        isFinite(lat) && isFinite(lng);
}

export default connectWebSocket;