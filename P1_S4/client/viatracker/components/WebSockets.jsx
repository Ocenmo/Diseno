import { useEffect, useState } from "react";

function WebSocketComponent() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://3.140.223.188:3000");

    ws.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, newMessage]);
    };

    ws.onclose = () => console.log("Conexión WebSocket cerrada");

    return () => ws.close();
  }, []);

  return (
    <div>
      <h1>Mensajes en Tiempo Real</h1>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{JSON.stringify(msg)}</li>
        ))}
      </ul>
    </div>
  );
}

export default WebSocketComponent;
