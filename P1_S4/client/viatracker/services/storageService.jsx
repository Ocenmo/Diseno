// storageService.js

const STORAGE_KEY = "lastLocation";

// Guarda los datos en localStorage
export const saveLastLocation = (data) => {
    if (data && data.latitude !== undefined && data.longitude !== undefined) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
};

// Obtiene los datos desde localStorage
export const getLastLocation = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : null;
};