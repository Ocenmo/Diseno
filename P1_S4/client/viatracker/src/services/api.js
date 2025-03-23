export const latestLocation = async () => {
    const response = await fetch(`${import.meta.env.VITE_DATA_ENDPOINT}`);
    if (!response.ok) {
        throw new Error("Error al obtener la ubicación");
    }
    return response.json();
}

export const rangoFechas = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_DATE_RANGE_ENDPOINT}`);
        if (!response.ok) {
            throw new Error("Error al obtener el rango de fechas");
        }
        return await response.json();
    } catch (error) {
        console.error("❌ Error en la petición de rango de fechas:", error);
        return null;
    }
};

export const rutas = async (inicio, fin) => {
    if (!inicio || !fin) {
        console.error("❌ Error: inicio y fin son requeridos");
        return null;
    }

    try {
        const response = await fetch(`${import.meta.env.VITE_ROUTE_ENDPOINT}?inicio=${inicio}&fin=${fin}`);
        if (!response.ok) {
            throw new Error(`Error al obtener la ruta: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("❌ Error en la petición de rutas:", error);
        return null;
    }
};
