const express = require('express');
const mysql = require('mysql2');
const dgram = require('dgram');
const http = require('http');
const WebSocket = require('ws');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let isPrimaryActive = true; 

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
        console.log("✅ Conectado a MySQL del servidor central");
    }
});

async function checkPrimaryServer() {
    try {
        const response = await fetch(`http://${process.env.PRIMARY_SERVER}:${process.env.PORT}/health`);
        isPrimaryActive = response.ok && (await response.json()).status === 'ok';
    } catch (error) {
        console.error('❌ Error al verificar servidor primario:', error);
        isPrimaryActive = false;
    }
    console.log(`Estado del servidor primario: ${isPrimaryActive ? 'Activo' : 'Inactivo'}`);
}

setInterval(checkPrimaryServer, 5000);

const udpServer = dgram.createSocket('udp4');

udpServer.bind(process.env.UDP_PORT, () => {
    console.log("✅ Servidor Secundario UDP escuchando en puerto", process.env.UDP_PORT);
});

udpServer.on('message', async (msg, rinfo) => {
    try {
        const datos = JSON.parse(msg.toString());
        console.log('\n=== Mensaje UDP Recibido ===');
        console.log(`Puerto: 4665`);
        console.log(`Remitente: ${rinfo.address}:${rinfo.port}`);
        console.log('Contenido:', msg.toString());
        console.log('========================\n');

        const { latitude, longitude, timestamp } = datos;

        const checkQuery = `
            SELECT id FROM mensaje 
            WHERE TimeStamp = ? 
            AND Latitud = ? 
            AND Longitud = ? 
            LIMIT 1
        `;

        db.query(checkQuery, [timestamp, latitude, longitude], (checkErr, checkResults) => {
            if (checkErr) {
                console.error("❌ Error al verificar duplicado:", checkErr);
                return;
            }

            if (checkResults.length === 0) {
                const insertQuery = 'INSERT INTO mensaje (Latitud, Longitud, TimeStamp) VALUES (?, ?, ?)';
                db.query(insertQuery, [latitude, longitude, timestamp], (err, result) => {
                    if (err) {
                        console.error("❌ Error al guardar en MySQL:", err);
                    } else {
                        console.log("✅ Datos guardados en MySQL (servidor secundario)");
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
            } else {
                console.log("ℹ️ Dato duplicado, no se insertará");

                const mensaje = JSON.stringify({
                    id: checkResults[0].id,
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

app.get('/datos', async (req, res) => {
    const query = 'SELECT id, Latitud, Longitud, timestamp FROM mensaje ORDER BY id DESC LIMIT 1';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener datos:', err);
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
    console.log("✅ Servidor Secundario en puerto", process.env.PORT);
});

// Manejo de errores del proceso
process.on('uncaughtException', (error) => {
    console.error('❌ Error no manejado:', error);
});