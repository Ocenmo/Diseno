import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { latestLocation } from "../services/api";

const latestData = latestLocation();
const defaultPosition = { lat: latestData.Latitud, lng: latestData.Longitud };
const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    if (!isLoaded) return <p>Cargando mapa...</p>;

    const validLat = typeof latitude === "number" && isFinite(latitude) ? latitude : defaultPosition.lat;
    const validLng = typeof longitude === "number" && isFinite(longitude) ? longitude : defaultPosition.lng;

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