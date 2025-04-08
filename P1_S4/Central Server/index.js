const express = require('express');
const mysql = require('mysql2');
const dgram = require('dgram');
const fs = require('fs');
const https = require('https');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();

// 🔒 Leer certificados SSL
const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
const credentials = { key: privateKey, cert: certificate };

// 🔐 Crear servidor HTTPS
const httpsServer = https.createServer(credentials, app);
const wss = new WebSocket.Server({ server: httpsServer });

let isActive = true;

// 📦 Servir frontend
app.use(express.static(path.join(__dirname, '../client/viatracker/dist')));
app.use(express.json());
app.use(cors());

// 🔄 Redirección de HTTP → HTTPS
http.createServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
}).listen(80, () => {
    console.log('🌐 Redirección HTTP->HTTPS activa en puerto 80');
});

// SPA fallback
app.get("*", (req, res, next) => {
    if (
        req.path.startsWith("/datos") ||
        req.path.startsWith("/rango-fechas") ||
        req.path.startsWith("/rutas") ||
        req.path.startsWith("/rutas-circulo") ||
        req.path.startsWith("/health")
    ) {
        return next();
    }

    res.sendFile(path.join(__dirname, '../client/viatracker/dist/index.html'));
});

// 📊 MySQL
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

// 🌐 UDP
const udpServer = dgram.createSocket('udp4');
udpServer.bind(process.env.UDP_PORT, () => {
    console.log("✅ Servidor Central UDP escuchando en puerto", process.env.UDP_PORT);
});

udpServer.on('message', (msg, rinfo) => {
    if (!isActive) return;

    try {
        const datos = JSON.parse(msg.toString());
        const { latitude, longitude, timestamp } = datos;

        const query = 'INSERT INTO mensaje (Latitud, Longitud, TimeStamp) VALUES (?, ?, ?)';
        db.query(query, [latitude, longitude, timestamp], (err, result) => {
        if (err) {
            console.error("❌ Error al guardar en MySQL:", err);
            isActive = false;
        } else {
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

// 📍 Endpoints
app.get('/health', (req, res) => {
    res.status(isActive ? 200 : 503).json({ status: isActive ? 'ok' : 'inactive' });
});

app.get('/datos', (req, res) => {
    const query = 'SELECT id, Latitud, Longitud, TimeStamp FROM mensaje ORDER BY id DESC LIMIT 1';
    db.query(query, (err, results) => {
        res.status(err ? 500 : 200).json(err ? { error: 'Error al obtener los datos' } : results);
    });
});

app.get('/rango-fechas', (req, res) => {
    const query = 'SELECT MIN(TimeStamp) as inicio, MAX(TimeStamp) as fin FROM mensaje';
    db.query(query, (err, results) => {
    res.status(err ? 500 : 200).json(err ? { error: 'Error al obtener el rango de fechas' } : results[0]);
    });
});

app.get('/rutas', (req, res) => {
    const { inicio, fin } = req.query;
    if (!inicio || !fin) return res.status(400).json({ error: 'Debe proporcionar inicio y fin' });

    const query = 'SELECT id, Latitud, Longitud, TimeStamp FROM mensaje WHERE TimeStamp BETWEEN ? AND ? ORDER BY TimeStamp';
    db.query(query, [inicio, fin], (err, results) => {
    res.status(err ? 500 : 200).json(err ? { error: 'Error al obtener la ruta' } : results);
    });
});

app.get("/rutas-circulo", (req, res) => {
    const { latitud_centro, longitud_centro, radio, inicio, fin } = req.query;
    if (!latitud_centro || !longitud_centro || !radio || !inicio || !fin) {
    return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }

    const query = `
    SELECT id, Latitud, Longitud, TimeStamp
    FROM mensaje
    WHERE TimeStamp BETWEEN ? AND ?
    AND ST_Distance_Sphere(point(Longitud, Latitud), point(?, ?)) <= ?
    ORDER BY TimeStamp`;

    db.query(query, [inicio, fin, longitud_centro, latitud_centro, radio], (err, results) => {
    res.status(err ? 500 : 200).json(err ? { error: "Error en la consulta SQL" } : results);
    });
});

// 🔌 WebSocket
wss.on('connection', (ws, req) => {
    console.log('✅ Cliente conectado vía WSS desde', req.connection.remoteAddress);

    ws.on('error', (error) => {
    console.error('❌ Error en WebSocket:', error);
    });

    ws.on('close', () => {
    console.log('❌ Conexión WebSocket cerrada');
    });
});

// 🚀 Iniciar servidor HTTPS en puerto 443
httpsServer.listen(443, () => {
    console.log("🔒 Servidor HTTPS escuchando en puerto 443");
});

// 🔚 Manejo de cierre
process.on('SIGINT', () => {
    console.log("\n🛑 Cerrando el servidor...");
    db.end(err => {
    if (err) console.error("❌ Error al cerrar MySQL:", err);
    else console.log("✅ Conexión a MySQL cerrada correctamente");
    process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('❌ Error no manejado:', error);
    isActive = false;
});
