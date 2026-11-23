const { wss } = require('#apps/web');
const { frameName, frameVer, frameID } = require('#config/core/core');
const { pluginName, pluginVer } = require('#config/cosmetic/config');
const { date } = require('#functions/core/date');
const { log } = require('#functions/core/log.mjs');
const WebSocket = require("ws");

module.exports = {
    // Example of a help menu given by the bot.
    // Input: none
    // Expected Return: An array of strings.
    help() {
        return [
            'Backend Clients:',
            '/clients: Administrative commands on commands!',
            '/clients info: Info on all clients connected!',
        ];
    },
    // Example of a command in the CLI (command line) of the bot.
    // Input: command given by the bot, readline function, client
    // Expected Return: true or false depending on if the command was valid or not. Otherwise, this breaks the code used to determine if a command is valid or not.
    async command(command) {
        switch (command.split(" ")[0].toLowerCase()) {
            case "/clients": // Prints various things. This mostly serves as a developer command.
                let print;
                if (command.split(" ")[1] != undefined) {
                    print = command.split(" ")[1].toLowerCase();
                }
                switch (print) {
                    case "i":
                    case "info":
                        log.info(`\x1b[36m---------------------- Client ----------------------\x1b[0m`)
                        const clients = [...wss.clients];

                        log.info(`Current clients: ${clients.length}`);
                        log.info(`Server: ${frameName} v${frameVer} (${pluginName} v${pluginVer}) / Version ID: ${frameID}`)

                        const start = Date.now()

                        const results = await Promise.all(clients.map(ws =>
                            new Promise((resolve) => {
                                if (ws.readyState !== WebSocket.OPEN) {
                                    return resolve({name: "Disconnected", end: NaN});
                                }

                                const timeout = setTimeout(() => {
                                    ws.off("message", onMessage);
                                    ws.off("close", onClose);
                                    resolve({name: "Timed out", end: NaN});
                                }, 5000);

                                function onMessage(raw) {
                                    let data;

                                    try {
                                        data = JSON.parse(raw.toString());
                                    } catch {
                                        return;
                                    }

                                    if (data.type !== "name") return;

                                    clearTimeout(timeout);
                                    ws.off("message", onMessage);
                                    ws.off("close", onClose);
                                    resolve({
                                        name: data.value,
                                        end: Date.now()
                                    });
                                }

                                function onClose() {
                                    clearTimeout(timeout);
                                    ws.off("message", onMessage);
                                    ws.off("close", onClose);
                                    resolve({name: "Disconnected", end: NaN});
                                }

                                ws.on("message", onMessage);
                                ws.once("close", onClose);

                                ws.send(JSON.stringify({ type: "getName" }), (error) => {
                                    if (error) onClose();
                                });
                            })
                        ));

                        results.forEach((result, index) => {
                            log.info(`Client ${index + 1}: ${result.name} (${result.end - start}ms)`);
                        });
                        log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                        break;
                    default:
                        log.warn(`Not a valid argument.`)
                        log.info(`Valid arguments:`)
                        log.info(`info - Prints some info on clients connected`)
                        log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                }
                return true;
            default:
                return false;
        }
    }
}