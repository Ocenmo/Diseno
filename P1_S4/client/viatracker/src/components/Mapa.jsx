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
        <div className="relative w-full h-[500px]">
            <GoogleMap className="w-screen h-screen"
            zoom={15}
            center={defaultPosition}
            mapContainerStyle={{ width: "100%", height: "1000px" }}
            >
            <div className="absolute w-full max-w-[90%] md:max-w-md h-fit bottom-40 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center justify-center border border-black rounded-[99px] bg-[#14213d] text-white shadow-[0_4px_8px_#081c15] px-4 py-3 overflow-hidden text-wrap break-words">
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
