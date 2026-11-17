const { wss } = require(`#index`);

module.exports = {
    async execute() {


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
    }
}