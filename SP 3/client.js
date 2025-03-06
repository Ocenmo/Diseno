const dgram = require('dgram');
const client = dgram.createSocket('udp4');

const mensaje = Buffer.from(JSON.stringify({
    latitud: 10.987654,
    longitud: -74.789012,
    timestamp: Math.floor(Date.now() / 1000) // Enviar en segundos (UNIX timestamp)
}));

client.send(mensaje, 4665, 'localhost', (err) => {
    if (err) console.error('❌ Error al enviar:', err);
    else console.log(' Mensaje enviado con éxito');
    client.close();
});
