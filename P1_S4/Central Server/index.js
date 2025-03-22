const express = require('express');
const mysql = require('mysql2');
const dgram = require('dgram');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors'); // 📌 Importa CORS
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let isActive = true;

app.use(express.static('public'));
app.use(express.json()); // 📌 Habilita el manejo de JSON en las solicitudes
app.use(cors()); // 📌 Habilita CORS para permitir acceso externo

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error("❌ Error al conectar MySQL:", err);
        isActive = false;
    } else {
        console.log("✅ Conectado a MySQL");
    }
});

db.query(`
    CREATE TABLE IF NOT EXISTS mensaje (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Latitud DECIMAL(10, 7),
        Longitud DECIMAL(10, 7),
        TimeStamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, err => {
    if (err) {
        console.error("❌ Error al crear la tabla:", err);
        isActive = false;
    } else {
        console.log("✅ Tabla lista en MySQL");
    }
});

const udpServer = dgram.createSocket('udp4');

udpServer.bind(process.env.UDP_PORT, () => {
    console.log("✅ Servidor Central UDP escuchando en puerto", process.env.UDP_PORT);
});

udpServer.on('message', (msg, rinfo) => {
    if (!isActive) {
        console.log("❌ Servidor inactivo, ignorando mensaje");
        return;
    }

    try {
        const datos = JSON.parse(msg.toString());
        console.log('\n=== Mensaje UDP Recibido ===');
        console.log(`Remitente: ${rinfo.address}:${rinfo.port}`);
        console.log('Contenido:', msg.toString());
        console.log('========================\n');

        const { latitude, longitude, timestamp } = datos;

        const query = 'INSERT INTO mensaje (Latitud, Longitud, TimeStamp) VALUES (?, ?, ?)';
        db.query(query, [latitude, longitude, timestamp], (err, result) => {
            if (err) {
                console.error("❌ Error al guardar en MySQL:", err);
                isActive = false;
            } else {
                console.log("✅ Datos guardados en MySQL");
                const mensaje = JSON.stringify({
                    id: result.insertId,
                    latitude,
                    longitude,
                    timestamp
                });
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(mensaje);
                    }
                });
            }
        });
    } catch (error) {
        console.error("❌ Error al procesar mensaje UDP:", error);
    }
});

app.get('/health', (req, res) => {
    if (isActive) {
        res.status(200).json({ status: 'ok' });
    } else {
        res.status(503).json({ status: 'inactive' });
    }
});

app.get('/datos', async (req, res) => {
    const query = 'SELECT id, Latitud, Longitud, TimeStamp FROM mensaje ORDER BY id DESC LIMIT 1';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener datos:', err);
            res.status(500).json({ error: 'Error al obtener los datos' });
        } else {
            res.json(results);
        }
    });
});

app.get('/rango-fechas', (req, res) => {
    const query = 'SELECT MIN(TimeStamp) as inicio, MAX(TimeStamp) as fin FROM mensaje';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener el rango de fechas:', err);
            res.status(500).json({ error: 'Error al obtener el rango de fechas' });
        } else {
            res.json(results[0]);
        }
    });
});

app.get('/rutas', (req, res) => {
    const { inicio, fin } = req.query;
    if (!inicio || !fin) {
        return res.status(400).json({ error: 'Debe proporcionar inicio y fin' });
    }
    const query = 'SELECT id, Latitud, Longitud, TimeStamp FROM mensaje WHERE TimeStamp BETWEEN ? AND ? ORDER BY TimeStamp';
    db.query(query, [inicio, fin], (err, results) => {
        if (err) {
            console.error('❌ Error al obtener la ruta:', err);
            res.status(500).json({ error: 'Error al obtener la ruta' });
        } else {
            res.json(results);
        }
    });
});

wss.on('connection', (ws, req) => {
    console.log('Cliente conectado desde', req.connection.remoteAddress);
    console.log('Cliente conectado desde', req.headers.origin);
    console.log('✅ Nueva conexión WebSocket establecida');

    ws.on('error', (error) => {
        console.error('❌ Error en WebSocket:', error);
    });

    ws.on('close', () => {
        console.log('❌ Conexión WebSocket cerrada');
    });
});

// 📌 Manejo de errores al iniciar el servidor
server.listen(process.env.PORT, "0.0.0.0", () => {
    console.log("✅ Servidor Central en puerto", process.env.PORT);
}).on('error', (err) => {
    console.error("❌ Error al iniciar el servidor:", err);
    process.exit(1);
});

// 📌 Manejo de cierre de base de datos
process.on('SIGINT', () => {
    console.log("\n🔴 Cerrando el servidor...");
    db.end(err => {
        if (err) {
            console.error("❌ Error al cerrar MySQL:", err);
        } else {
            console.log("✅ Conexión a MySQL cerrada correctamente");
        }
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('❌ Error no manejado:', error);
    isActive = false;
});