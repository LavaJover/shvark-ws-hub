const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:3003");
ws.onopen = () => {
  ws.send(JSON.stringify({ type: "subscribe", traderId: "uuid-1" }));
};
ws.onmessage = (msg) => {
  console.log("Notification:", JSON.parse(msg.data));
};