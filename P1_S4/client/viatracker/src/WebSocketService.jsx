// WebSocketService.js
export const connectWebSocket = (setData) => {
    const ws = new WebSocket("ws://3.140.223.188:3000");

    ws.onmessage = (event) => {
        try {
            const newData = JSON.parse(event.data);
            console.log("Nuevo dato recibido:", newData);

            setData([{
                id: newData.id ?? "N/A",
                latitude: newData.latitude ?? "N/A",
                longitude: newData.longitude ?? "N/A",
                timestamp: newData.timestamp ?? "N/A",
            }]);
        } catch (err) {
            console.error("Error procesando mensaje WebSocket:", err);
        }
    };

    ws.onerror = (err) => {
        console.error("Error en WebSocket:", err);
    };

    ws.onclose = () => {
        console.warn("Conexión WebSocket cerrada");
    };

    return ws; // Retorna la conexión WebSocket para cerrarla cuando sea necesario
};

export default connectWebSocket;