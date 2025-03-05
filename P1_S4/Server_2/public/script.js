const currentLat = document.getElementById("current-lat");
const currentLon = document.getElementById("current-lon");
const currentTime = document.getElementById("current-time");

const socket = new WebSocket('ws://lamaho.ddns.net:3000/:3000'); 

socket.onmessage = function(event) {
    const nuevoDato = JSON.parse(event.data);
    currentLat.textContent = nuevoDato.latitude;
    currentLon.textContent = nuevoDato.longitude;
    currentTime.textContent = new Date(nuevoDato.timestamp).toLocaleString();
};

window.onload = function() {
    fetch('/datos')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const ultimoDato = data[0];
                currentLat.textContent = ultimoDato.Latitud;
                currentLon.textContent = ultimoDato.Longitud;
                currentTime.textContent = new Date(ultimoDato.timestamp).toLocaleString();
            }
        })
        .catch(error => console.error('❌ Error al obtener datos:', error));
};

socket.onerror = function(error) {
    console.error('WebSocket error:', error);
};

socket.onclose = function(event) {
    console.log('WebSocket cerrado. Intentando reconectar...');
    setTimeout(() => {
        socket = new WebSocket('ws://lamaho.ddns.net:3000:3000');
    }, 5000);
};