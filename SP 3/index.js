const express = require('express');
const mysql = require('mysql2');
const dgram = require('dgram');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public')); // Sirve archivos estáticos desde "public"

// Configurar MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'La contraseña que hayas puesto',
    database: 'Local_instance_MySQL80'
});

db.connect(err => {
    if (err) {
        console.error("❌ Error al conectar MySQL:", err);
    } else {
        console.log("✅ Conectado a MySQL");
    }
});

// Crear tabla si no existe
db.query(`
    CREATE TABLE IF NOT EXISTS mensaje (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Latitud DECIMAL(10, 6),
        Longitud DECIMAL(10, 6),
        TimeStamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, err => {
    if (err) console.error(" Error al crear la tabla:", err);
    else console.log(" Tabla lista en MySQL");
});

// Servidor UDP
const udpServer = dgram.createSocket('udp4');
udpServer.bind(4665, () => {
    console.log(" Servidor UDP escuchando en el puerto 4665");
});

udpServer.on('message', (msg, rinfo) => {
    try {
        const datos = JSON.parse(msg.toString());
        console.log(` Mensaje recibido de ${rinfo.address}:${rinfo.port} ->`, datos);

        const { latitud, longitud, timestamp } = datos;
        const fecha = new Date(timestamp * 1000).toISOString().slice(0, 19).replace('T', ' ');

        const query = 'INSERT INTO mensaje (Latitud, Longitud, TimeStamp) VALUES (?, ?, ?)';
        db.query(query, [latitud, longitud, fecha], (err, result) => {
            if (err) {
                console.error(" Error al guardar en MySQL:", err);
            } else {
                console.log(" Datos guardados en MySQL");

                // Enviar datos a los clientes WebSocket
                const mensaje = JSON.stringify({ id: result.insertId, latitud, longitud, timestamp });
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(mensaje);
                    }
                });
            }
        });
    } catch (error) {
        console.error(" Error al procesar mensaje UDP:", error);
    }
});

// Ruta para obtener datos guardados
app.get('/datos', (req, res) => {
    const query = 'SELECT id, Latitud, Longitud, UNIX_TIMESTAMP(TimeStamp) AS timestamp FROM mensaje ORDER BY id DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error(' Error al obtener datos de MySQL:', err);
            res.status(500).json({ error: 'Error al obtener los datos' });
        } else {
            res.json(results);
        }
    });
});

// Servidor HTTP y WebSockets
server.listen(3000, () => {
    console.log(" Servidor HTTP en http://localhost:3000");
});
