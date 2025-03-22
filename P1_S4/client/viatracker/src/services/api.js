export const latestLocation = async () => {
    const response = await fetch(`${import.meta.env.VITE_DATA_ENDPOINT}`);
    if (!response.ok) {
        throw new Error("Error al obtener la ubicación");
    }
    return response.json();
}

export const rangoFechas = async () => {
    const response = await fetch(`${import.meta.env.VITE_DATE_RANGE_ENDPOINT}`);
    if (!response.ok) {
        throw new Error("Error al obtener el rango de fechas");
    }
    return response.json();
}

export const rutas = async (inicio, fin) => {
    const response = await fetch(`${import.meta.env.VITE_ROUTE_ENDPOINT}?inicio=${inicio}&fin=${fin}`);
    if (!response.ok) {
        throw new Error("Error al obtener la ruta");
    }
    return response.json();
}