require("dotenv").config();
const express = require("express");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

const HTTP_PORT = process.env.HTTP_PORT || 3002;
const WS_PORT = process.env.WS_PORT || 3003;

const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`WS Hub listening on ws://localhost:${WS_PORT}`);

const subscriptions = {}; // traderId → [ws, ws, ...]

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket Hub");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "subscribe" && data.traderId) {
        if (!subscriptions[data.traderId]) {
          subscriptions[data.traderId] = [];
        }
        subscriptions[data.traderId].push(ws);
        console.log(`Subscribed client to ${data.traderId}`);
      }
    } catch (err) {
      console.error("Invalid WS message:", err.message);
    }
  });

  ws.on("close", () => {
    for (const traderId in subscriptions) {
      subscriptions[traderId] = subscriptions[traderId].filter((client) => client !== ws);
    }
  });
});

// HTTP API для публикации события
app.post("/publish", (req, res) => {
  const { traderId, event, payload } = req.body;
  if (!traderId || !event) {
    return res.status(400).json({ error: "Missing traderId or event" });
  }

  const clients = subscriptions[traderId] || [];
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, payload }));
    }
  }

  return res.json({ delivered: clients.length });
});

app.listen(HTTP_PORT, () => {
  console.log(`WS Hub HTTP API listening on http://localhost:${HTTP_PORT}`);
});
