export const connectWebSocket = (setDataCallback) => {
    const wsUrl = import.meta.env.VITE_WS_URL;
    let reconnectInterval = 5000;
    let ws;

    const connect = () => {
        console.log("Conectando a WebSocket en", wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Conexión WebSocket establecida");
        };

        ws.onmessage = (event) => {
            try {
                const newData = JSON.parse(event.data);
                console.log("Nuevo dato recibido:", newData);

                if (isValidCoordinate(newData.latitude, newData.longitude)) {
                    setDataCallback(newData);
                }
            } catch (err) {
                console.error("Error procesando mensaje WebSocket:", err);
            }
        };

        ws.onerror = (err) => console.error("Error en WebSocket:", err);
        ws.onclose = () => {
            console.warn("Conexión WebSocket cerrada, reconectando en", reconnectInterval, "ms");
            setTimeout(connect, reconnectInterval);

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