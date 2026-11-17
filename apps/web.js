// Mini little web server
const WebSocket = require('ws');
const { createServer } = require('http');
const express = require('express');
const { log } = require('#functions/core/log');

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Use express.json
app.use(express.json());

// Modular export
module.exports = {
    app,
    server,
    wss,
    async execute() {
        try {
            server.listen(process.env.PORT, () => {
                log("INFO", `Listening at port ${process.env.PORT}`);
            });
        } catch {
            log("ERROR", "Could not open server.")
            console.error(error)
        }
    },
    async close() {
        try {
            server.close();
        } catch (error) {
            log("ERROR", "Could not close server.")
            console.error(error)
        }
    }
}