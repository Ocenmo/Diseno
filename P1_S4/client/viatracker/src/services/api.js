export const latestLocation = async () => {
    const response = await fetch(`${import.meta.env.VITE_DATA_ENDPOINT}`);
    if (!response.ok) {
        throw new Error("Error al obtener la ubicación");
    }
    return response.json();
}