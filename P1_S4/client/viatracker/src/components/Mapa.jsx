import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { latestLocation } from "../services/api";
import Table from "./Table";

const Map = ({ latitude, longitude, data }) => {

    const [defaultPosition, setDefaultPosition] = useState({ lat: 11.022092, lng: -74.851364 });
    const [path, setPath] = useState([]);

    useEffect(() => {
        if (latitude !== undefined && longitude !== undefined) {
            const newPosition = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
            if (!isNaN(newPosition.lat) && !isNaN(newPosition.lng)) {
                setDefaultPosition(newPosition);
                setPath((prevPath) => [...prevPath, newPosition]); // Construye la polilínea en tiempo real
            }
        } else {
            const fetchLatestLocation = async () => {
                try {
                    const latestData = await latestLocation();
                    console.log("Datos crudos de latestLocation:", latestData);
                    if (latestData?.[0]?.latitude !== undefined && latestData?.[0]?.longitude !== undefined) {
                        const initialPosition = {
                            lat: parseFloat(latestData[0].latitude),
                            lng: parseFloat(latestData[0].longitude),
                        };
                        if (!isNaN(initialPosition.lat) && !isNaN(initialPosition.lng)) {
                            setDefaultPosition(initialPosition);
                            setPath([initialPosition]);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching latest location:", error);
                }
            };
            fetchLatestLocation();
        }
    }, [latitude, longitude]);

    return (
        <div className="flex-1 relative">
            <GoogleMap className="w-full h-full rounded-xl shadow-lg"
            options={{ disableDefaultUI: true, zoomControl: true }}
            zoom={15}
            center={defaultPosition}
            mapContainerStyle={{ width: "100%", height: "calc(100vh - 60px)" }}
            >

            <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-[80%] md:max-w-3xl px-4 ">
                <Table data={data ? [data] : []} />
            </div>
                <Marker position={defaultPosition} />
                {path.length > 1 && (
                    <Polyline
                        path={path}
                        options={{ strokeColor: "#2d6a4f", strokeOpacity: 1, strokeWeight: 2 }}
                    />
                )}
            </GoogleMap>
        </div>
    );
};

export default Map;
