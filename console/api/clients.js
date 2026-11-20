const { wss } = require('#apps/web');
const { date } = require('#functions/core/date');
const { log } = require('#functions/core/log.mjs');

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
                        const clientCount = wss.clients.size;
                        log.info(`Current clients: ${clientCount}`)
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