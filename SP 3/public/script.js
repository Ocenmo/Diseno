//Recuperando datos del servidor
const tabla = document.getElementById("tabla-datos");
let ArrayDatos = [];

const socket = new WebSocket('ws://localhost:3000');

        socket.onmessage = function(event) {
            const nuevoDato = JSON.parse(event.data);
            agregarFila(nuevoDato, false);
            console.log(nuevoDato);
        };

        function agregarFila(dato, insertBackwards) {
            let row = tabla.insertRow(insertBackwards ? -1 : 0);
            //let row = tabla.insertRow(0);
            row.insertCell(0).innerText = dato.id;
            row.insertCell(1).innerText = dato.latitud;
            row.insertCell(2).innerText = dato.longitud;
            row.insertCell(3).innerText = new Date(dato.timestamp * 1000).toLocaleString();
        }

        window.onload = function() {
            fetch('/datos')
                .then(response => response.json())
                .then(data => {
                    ArrayDatos = data;
                    data.forEach(dato => {
                        const nuevoDato = {
                            id: dato.id,
                            latitud: dato.Latitud,
                            longitud: dato.Longitud,
                            timestamp: dato.timestamp
                        };
                        agregarFila(nuevoDato, true);
                        console.log(nuevoDato);
                    });
                })
                .catch(error => console.error('❌ Error al obtener datos:', error));
        };