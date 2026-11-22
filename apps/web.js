// Mini little web server
const WebSocket = require('ws');
const { createServer } = require('http');
const express = require('express');
const { log } = require('#functions/core/log.mjs');
const { token } = require('#config/core/api');

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

        if (typeof token !== "string" || token.length === 0) {
            log.error("Server token is missing or invalid.", new Error("Token is missing or does not exist."));
        } else if (token.length < 8) {
            log.error("Token length is not big enough.", new Error("Token is too small."));
        }
        
        await new Promise((resolve, reject) => {
            const onError = (error) => {
                server.off("listening", onListening);
                reject(error);
            };

            const onListening = () => {
                server.off("error", onError);
                log.success(`Listening at port ${process.env.PORT}`);
                resolve();
            };

            server.once("error", onError);
            server.once("listening", onListening);
            server.listen(process.env.PORT);
        });
    },

    async close() {
        // Terminate WebSocket clients
        for (const client of wss.clients) {
            client.terminate();
        }

        // Close WebSocket server
        await new Promise((resolve, reject) => {
            wss.close(error => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Close HTTP server
        if (server.listening) {
            await server[Symbol.asyncDispose]();
        }
    }
}