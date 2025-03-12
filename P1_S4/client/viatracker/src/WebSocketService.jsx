export const connectWebSocket = (setData) => {
    const ws = new WebSocket("ws://3.140.223.188:3000");

    ws.onmessage = (event) => {
        try {
            const newData = JSON.parse(event.data);
            console.log("Nuevo dato recibido:", newData);

            if (isValidCoordinate(newData.latitude, newData.longitude)) {
                setData([{
                    id: newData.id ?? "N/A",
                    latitude: newData.latitude,
                    longitude: newData.longitude,
                    timestamp: newData.timestamp ?? "N/A",
                }]);

                localStorage.setItem("latitude", newData.latitude);
                localStorage.setItem("longitude", newData.longitude);
            }
        } catch (err) {
            console.error("Error procesando mensaje WebSocket:", err);
        }
    };

    ws.onerror = (err) => console.error("Error en WebSocket:", err);
    ws.onclose = () => console.warn("Conexión WebSocket cerrada");

    return ws;
};

function isValidCoordinate(lat, lng) {
    return typeof lat === "number" && typeof lng === "number" &&
            isFinite(lat) && isFinite(lng);
}

export default connectWebSocket;
