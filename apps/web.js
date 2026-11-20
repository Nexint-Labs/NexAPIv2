// Mini little web server
const WebSocket = require('ws');
const { createServer } = require('http');
const express = require('express');
const { log } = require('#functions/core/log.mjs');

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
                log.success(`Listening at port ${process.env.PORT}`);
            });
        } catch (error) {
            log.error("Could not open server.", error)
        }
    },
    async reload() {
        try {
            await server[Symbol.asyncDispose]();
            server.listen(process.env.PORT, () => {
                log.success(`Listening at port ${process.env.PORT}`);
            });
        } catch (error) {
            log.error("Could not open server.", error)
        }
    },
    async close() {
        try {
            await server[Symbol.asyncDispose]();
        } catch (error) {
            log.error("Could not close server.", error)
        }
    }
}