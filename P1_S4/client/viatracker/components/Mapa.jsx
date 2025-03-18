import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const defaultPosition = { lat: 37.7749, lng: -122.4194 };

const Map = ({ latitude, longitude }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
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