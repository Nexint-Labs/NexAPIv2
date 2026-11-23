const WebSocket = require("ws");
const { wss } = require("#apps/web");
const { log } = require("#functions/core/log.mjs");

let heartbeatInterval = null;

function onConnection(ws) {
    log.event("New client connected");

    ws.isAlive = true;

    ws.on("pong", () => {
        ws.isAlive = true;
    });

    ws.send("Welcome to the WebSocket server!");

    ws.on("message", (message) => {
        let data;

        try {
            data = JSON.parse(message.toString());
        } catch {
            return;
        }
    });

    ws.on("close", () => {
        log.event("Client disconnected");
    });
}

module.exports = {
    async execute() {
        wss.on("connection", onConnection);

        heartbeatInterval = setInterval(() => {
            for (const ws of wss.clients) {
                if (ws.isAlive === false) {
                    ws.terminate();
                    continue;
                }

                if (ws.readyState !== WebSocket.OPEN) continue;

                ws.isAlive = false;
                ws.ping();
            }
        }, 30000);
    },

    async close() {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;

        wss.off("connection", onConnection);
    }
};