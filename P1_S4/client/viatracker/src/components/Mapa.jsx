import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const defaultPosition = { lat: 37.7749, lng: -122.4194 };
const ApiKey = import.meta.env.VITE_API_KEY;

const Map = ({ latitude, longitude }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ApiKey,
    });

    console.log("Google Maps API Key:", ApiKey);

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