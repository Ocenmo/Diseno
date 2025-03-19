export const latestLocation = async () => {
    const response = await fetch(`${import.meta.env.VITE_WS_URL}/datos`);
    if (!response.ok) {
        throw new Error("Error al obtener la ubicación");
    }
    return response.json();
}