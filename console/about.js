const { wss } = require('#apps/web');
const { frameName, frameVer } = require('#config/core/core');
const { pluginName, pluginVer } = require('#config/cosmetic/config');
const { date } = require('#functions/core/date');
const { log } = require('#functions/core/log');
const { getUpdateVersion } = require('#index');

module.exports = {
    // Example of a help menu given by the bot.
    // Input: none
    // Expected Return: An array of strings.
    help() {
        return [
            'Developer:',
            '/print (args) - Prints stuff to the console!',
            'By default, /print prints what possible arguments there are.',
        ];
    },
    // Example of a command in the CLI (command line) of the bot.
    // Input: command given by the bot, readline function, client
    // Expected Return: true or false depending on if the command was valid or not. Otherwise, this breaks the code used to determine if a command is valid or not.
    async command(command) {
        switch (command.split(" ")[0].toLowerCase()) {
            case "/print": // Prints various things. This mostly serves as a developer command.
                let print;
                if (command.split(" ")[1] != undefined) {
                    print = command.split(" ")[1].toLowerCase();
                }
                switch (print) {
                    case "v":
                    case 'version':
                        let latestVersion = getUpdateVersion();
                        log("INFO", "Printing the version...")
                        log("INFO", `${pluginName} Version: ${pluginVer}`)
                        log("INFO", `${frameName} Version: ${frameVer} (Version ID: ${frameID}) / Latest version ID: ${latestVersion}.`)
                        if (latestVersion > versionID) {
                            log("INFO", `${latestVersion - versionID} commits behind.`)
                        } else if (latestVersion == 0) {
                            log("WARN", `Updates may or may not be working.`)
                        } else if (latestVersion < versionID) {
                            log("INFO", `${versionID - latestVersion} commits ahead.`)
                        } else {
                            log("WARN", `Running the latest version.`)
                        }
                        log("INFO", `\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                        break;
                    case "clients":
                        const clientCount = wss.clients.size;
                        log("INFO", `Current clients: ${clientCount}`)
                        log("INFO", `\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                        break;
                    case "b":
                    case 'build':
                        log("INFO", `Printing the build!`)
                        log("INFO", `${pluginName} v${pluginVer}`)
                        log("INFO", `${frameName} v${frameVer}`)
                        log("INFO", `\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                        break;
                    default:
                        log("WARN", `Not a valid argument.`)
                        log("INFO", `Valid arguments:`)
                        log("INFO", `version - Prints version info`)
                        log("INFO", `build - Prints ${frameName} build`)
                        log("INFO", `clients - Prints the # of clients connected`)
                        log("INFO", `\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                }
                return true;
            default:
                return false;
        }
    }
}