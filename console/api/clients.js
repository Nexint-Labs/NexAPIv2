const { wss } = require('#apps/web');
const { frameName, frameVer, frameID } = require('#config/core/core');
const { pluginName, pluginVer } = require('#config/cosmetic/config');
const { date } = require('#functions/core/date');
const { log } = require('#functions/core/log.mjs');
const WebSocket = require("ws");


const clientAction = async function (action, target = "all") {
    const clients = [...wss.clients];
    const index = Number(target);

    if (target !== "all" && (!Number.isInteger(index) || index < 1 || index > clients.length)) {
        log.warn("Invalid client number.");
        return;
    }

    const selected = target === "all" ? clients : [clients[index - 1]];

    const results = await Promise.all(selected.map(ws =>
        new Promise(resolve => {
            const number = clients.indexOf(ws) + 1;

            if (ws.readyState !== WebSocket.OPEN) {
                return resolve({ number, status: "Disconnected", latency: null });
            }

            const start = Date.now();

            const timeout = setTimeout(() => {
                ws.off("message", onMessage);
                ws.off("close", onClose);
                resolve({ number, status: "Timed out", latency: null });
            }, 5000);

            function onMessage(raw) {
                let data;

                try {
                    data = JSON.parse(raw.toString());
                } catch {
                    return;
                }

                if (data.type !== (action === "info" ? "name" : action)) return;

                clearTimeout(timeout);
                ws.off("message", onMessage);
                ws.off("close", onClose);
                resolve({
                    number,
                    status: data.value,
                    latency: Date.now() - start
                });
            }

            function onClose() {
                clearTimeout(timeout);
                ws.off("message", onMessage);
                ws.off("close", onClose);
                resolve({ number, status: "Disconnected", latency: null });
            }

            ws.on("message", onMessage);
            ws.once("close", onClose);

            ws.send(JSON.stringify({
                type: action === "info" ? "getName" : action
            }), error => {
                if (error) onClose();
            });
        })
    ));

    results.forEach(result => {
        if (action === "info") {
            log.info(`Client ${result.number}: ${result.status} (${result.latency === null ? "N/A" : `${result.latency}ms`})`);
        } else {
            log.info(`Client ${result.number}: ${action} - ${result.status}`);
        }
    });
}



module.exports = {
    // Example of a help menu given by the bot.
    // Input: none
    // Expected Return: An array of strings.
    help() {
        return [
            'Backend Clients:',
            '/clients: Administrative commands on commands!',
            '/clients info: Info on all clients connected!',
            '/clients restart <number|all>: Restart client(s)!',
            '/clients refresh <number|all>: Refresh client(s)!',
            '/clients reload <number|all>: Reload client(s)!',
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
                        log.info(`Current clients: ${wss.clients.size}`);
                        log.info(`Server: ${frameName} v${frameVer} (${pluginName} v${pluginVer}) / Version ID: ${frameID}`)

                        await clientAction("info");

                        log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                        break;


                    case "restart":
                    case "refresh":
                    case "reload":
                        await clientAction(print, command.split(" ")[2]?.toLowerCase());
                        break;
                    default:
                        log.warn(`Not a valid argument.`)
                        log.info(`Valid arguments:`)
                        log.info(`info - Prints some info on clients connected`)
                        log.info(`restart <number|all>: Restart client(s)!`)
                        log.info(`refresh <number|all>: Refresh client(s)!`)
                        log.info(`reload <number|all>: Reload client(s)!`)
                        log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                }
                return true;
            default:
                return false;
        }
    }
}