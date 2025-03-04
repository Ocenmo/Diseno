const express = require('express');
const mysql = require('mysql2');
const dgram = require('dgram');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public')); 

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error("❌ Error al conectar MySQL:", err);
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
    if (err) console.error("❌ Error al crear la tabla:", err);
    else console.log("✅ Tabla lista en MySQL");
});

const udpServer = dgram.createSocket('udp4');
udpServer.bind(process.env.UDP_PORT, () => {
    console.log("✅ Servidor UDP escuchando en el puerto", process.env.UDP_PORT);
});

function broadcastData(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

udpServer.on('message', (msg, rinfo) => {
    try {
        const datos = JSON.parse(msg.toString());
        console.log(`📥 Mensaje recibido de ${rinfo.address}:${rinfo.port} ->`, datos);

        if (!validarDatos(datos)) {
            console.error('❌ Datos inválidos recibidos');
            return;
        }

        const { latitude, longitude, timestamp } = datos;

        const query = 'INSERT INTO mensaje (Latitud, Longitud, TimeStamp) VALUES (?, ?, ?)';
        db.query(query, [latitude, longitude, timestamp], (err, result) => {
            if (err) {
                console.error("❌ Error al guardar en MySQL:", err);
            } else {
                console.log("✅ Datos guardados en MySQL");
                
                broadcastData({ 
                    id: result.insertId,
                    latitude, 
                    longitude, 
                    timestamp 
                });
            }
        });
    } catch (error) {
        console.error("❌ Error al procesar mensaje UDP:", error);
    }
});

app.get('/datos', async (req, res) => {
    const query = 'SELECT id, Latitud, Longitud, timestamp FROM mensaje ORDER BY id DESC LIMIT 1';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener datos de MySQL:', err);
            res.status(500).json({ error: 'Error al obtener los datos' });
        } else {
            res.json(results);
        }
    });
});

wss.on('connection', (ws) => {
    console.log('✅ Nueva conexión WebSocket establecida');
    
    ws.on('error', (error) => {
        console.error('❌ Error en WebSocket:', error);
    });

    ws.on('close', () => {
        console.log('❌ Conexión WebSocket cerrada');
    });
});

server.listen(process.env.PORT, () => {
    console.log("✅ Servidor HTTP en http://localhost:" + process.env.PORT);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Error no manejado:', error);
});

process.on('SIGTERM', () => {
    console.log('🛑 Cerrando servidor...');
    server.close(() => {
        db.end();
        process.exit(0);
    });
});