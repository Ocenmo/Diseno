const dgram = require('dgram');
const mysql = require('mysql2');
const express = require('express');

const app = express();
const udpServer = dgram.createSocket('udp4');

const PORT_UDP = 4665;
const PORT_HTTP = 3000;

// 📌 Configuración de la base de datos MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'oCENMOP_02_07',
    database: 'Local_instance_MySQL80'
});

db.connect(err => {
    if (err) {
        console.error(' Error conectando a MySQL:', err);
    } else {
        console.log(' Conectado a MySQL');
    }
});

// 📌 Creación de la tabla si no existe
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS transacciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        latitud VARCHAR(255) NOT NULL,
        longitud VARCHAR(255) NOT NULL,
        timestamp DATETIME NOT NULL
    )
`;
db.query(createTableQuery, (err) => {
    if (err) console.error(' Error creando tabla:', err);
    else console.log(' Tabla lista en MySQL');
});

// Servidor UDP que escucha mensajes en el puerto 4665
udpServer.on('message', (msg, rinfo) => {
    console.log(`📩 Mensaje recibido de ${rinfo.address}:${rinfo.port} -> ${msg}`);

    try {
        const datos = JSON.parse(msg.toString()); // Aseguramos conversión correcta de buffer a string
        const { latitud, longitud, timestamp } = datos;

        if (!latitud || !longitud || !timestamp) {
            console.error(" Datos incompletos recibidos:", datos);
            return;
        }

        // Convertimos el timestamp de Unix a formato de fecha MySQL
        const fechaFormateada = new Date(timestamp * 1000).toISOString().slice(0, 19).replace("T", " ");

        const query = 'INSERT INTO transacciones (latitud, longitud, timestamp) VALUES (?, ?, ?)';
        db.query(query, [latitud, longitud, fechaFormateada], (err) => {
            if (err) console.error(' Error al guardar en la base de datos:', err);
            else console.log(' Datos guardados en MySQL:', datos);
        });

    } catch (error) {
        console.error(' Error al procesar el mensaje:', error.message);
    }
});

// Evento cuando el servidor UDP empieza a escuchar
udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`🚀 Servidor UDP escuchando en ${address.address}:${address.port}`);
});

// Iniciar servidor UDP en el puerto 4665
udpServer.bind(PORT_UDP);

// Página principal
app.get('/', (req, res) => {
    res.send('<h1>Servidor funcionando :) </h1><p>Para ver los datos, ve a <a href="/datos">/datos</a></p>');
});

// Servidor HTTP para obtener los datos en una tabla
app.get('/datos', (req, res) => {
    db.query('SELECT * FROM transacciones', (err, results) => {
        if (err) {
            console.error('❌ Error al obtener datos:', err);
            res.status(500).send('Error en el servidor');
        } else {
            let html = '<h1>Datos de Transacciones</h1>';
            html += `<p>Hay ${results.length} transacciones almacenadas</p>`;
            html += '<table border="1"><tr><th>ID</th><th>Latitud</th><th>Longitud</th><th>TimeStamp</th></tr>';
            results.forEach(row => {
                html += `<tr>
                    <td>${row.id}</td>
                    <td>${row.latitud}</td>
                    <td>${row.longitud}</td>
                    <td>${row.timestamp}</td>
                </tr>`;
            });
            html += '</table>';
            html += '<p><a href="/">Volver al inicio</a></p>';
            res.send(html);
        }
    });
});

// Iniciar servidor HTTP en el puerto x en este caso 3000
app.listen(PORT_HTTP, () => {
    console.log(`🌍 Servidor HTTP en http://localhost:${PORT_HTTP}`);
});
