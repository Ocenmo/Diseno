const currentLat = document.getElementById("current-lat");
const currentLon = document.getElementById("current-lon");
const currentTime = document.getElementById("current-time");

const socket = new WebSocket('ws://3.140.223.188:3000');



async function initMap() {
    const position = { lat: -25.344, lng: 131.031 }; // Coordenadas iniciales

    // Cargar la API de Google Maps
    const { Map } = await google.maps.importLibrary("maps");
    const { Marker } = await google.maps.importLibrary("marker");

    // Inicializar el mapa
    map = new Map(document.getElementById("map"), {
        zoom: 8,
        center: position,
        mapId: "TU_MAP_ID_AQUÍ", // Si usas estilos avanzados, coloca aquí el mapId
    });

    // Crear el marcador
    marker = new Marker({
        map: map,
        position: position,
        title: "Ubicación en tiempo real",
    });
}

initMap();

// Manejo de mensajes WebSocket
socket.onmessage = function(event) {
    const nuevoDato = JSON.parse(event.data);
    const latLng = new google.maps.LatLng(nuevoDato.latitude, nuevoDato.longitude);

    map.setCenter(latLng);
    marker.setPosition(latLng);

    currentLat.textContent = nuevoDato.latitude;
    currentLon.textContent = nuevoDato.longitude;
    currentTime.textContent = new Date(nuevoDato.timestamp).toLocaleString();
};

// Manejo de errores WebSocket
socket.onerror = function(error) {
    console.error('WebSocket error:', error);
};

// Reconexión automática en caso de desconexión
socket.onclose = function(event) {
    console.log('WebSocket cerrado. Intentando reconectar...');
    setTimeout(() => {
        socket = new WebSocket('ws://viatracker.ddns.net:3000');
        socket.onmessage = function(event) {
            const nuevoDato = JSON.parse(event.data);
            const latLng = new google.maps.LatLng(nuevoDato.latitude, nuevoDato.longitude);

            map.setCenter(latLng);
            marker.setPosition(latLng);

            currentLat.textContent = nuevoDato.latitude;
            currentLon.textContent = nuevoDato.longitude;
            currentTime.textContent = new Date(nuevoDato.timestamp).toLocaleString();
        };
    }, 5000);
};
