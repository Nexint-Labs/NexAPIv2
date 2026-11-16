// Import the .env lol
const env = require('dotenv').config({ path: __dirname + '/.env' })
const { log } = require('#functions/core/log')
if (env === undefined) {
    log("CRITICAL", "No .env file was provided.")
    throw new Error("No env file exists lol please make it :)")
}

// Set the directory
try {
    process.chdir(__dirname);
} catch (error) {
    log("CRITICAL", "Could not set the directory.")
    throw new Error(error)
}

log("INFO", "Starting Server");

// Make sure directories exist lol
const fs = require('node:fs');
const path = require('path');
const dirs = ["plugins", "preload", "console"]
dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        log("INFO", `Creating directory: ${dir}`);
        fs.mkdirSync(path.join(__dirname, dir));
    }
})

// Import web-based dependencies
const WebSocket = require('ws');
const { createServer } = require('http');
const express = require('express');

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Use express.json
app.use(express.json());

// Connection event handler
wss.on('connection', (ws) => {
    console.log('New client connected');

    // Send a welcome message to the client
    ws.send('Welcome to the WebSocket server!');

    // Message event handler
    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        // Echo the message back to the client
        ws.send(`Server received: ${message}`);
    });

    // Close event handler
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Get the slash directory?
app.get('/', (request, response) => {
    return 'Hello World!';
});

// Export the app and wss
module.exports = {
    app,
    wss
}

// WIP: plugin loader
server.listen(process.env.PORT, () => {
    log("INFO", `Listening at port ${process.env.PORT}`);
});
