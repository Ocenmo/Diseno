import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const Map = ({ latitude, longitude }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: "AIzaSyB5em391M0eCTbKlaH610KzWPno8rBiMPc", // Reemplaza con tu clave API
    });

    if (!isLoaded) return <p>Cargando mapa...</p>;

    return (
        <GoogleMap
            zoom={15} // Ajusta el zoom para ver bien la ubicación
            center={{ lat: latitude, lng: longitude }}
            mapContainerStyle={{ width: "100%", height: "500px" }}
        >
            <Marker position={{ lat: latitude, lng: longitude }} />
        </GoogleMap>
    );
};

export default Map;
