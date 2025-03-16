/* eslint-disable no-undef */
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import dotenv from 'dotenv';

dotenv.config();

const defaultPosition = { lat: 37.7749, lng: -122.4194 };
const Map = ({ latitude = defaultPosition.lat, longitude = defaultPosition.lng }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.MAP_KEY, // Reemplaza con tu clave API
    });

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const validLat = isFinite(latitude) ? latitude : defaultPosition.lat;
    const validLng = isFinite(longitude) ? longitude : defaultPosition.lng;

    return (
        <GoogleMap
            zoom={15} // Ajusta el zoom para ver bien la ubicación
            center={{ lat: validLat, lng: validLng }}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            <Marker position={{ lat: validLat, lng: validLng }} />
        </GoogleMap>
    );
};

export default Map;
