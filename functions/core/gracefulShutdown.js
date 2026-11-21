const { date } = require("./date");
const { close } = require("./load");
const { log } = require("./log.mjs");


/**
 * Graceful Shutdown of bot
 * Exit: Determines if the process exits immediately or not.
 * @param {String} cause 
 * @param {Boolean} exit 
 */
const gracefulShutdown = async function (cause, exit) {
    log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
    log.info(`Shutdown triggered by: ${cause}`)
    log.info("Closing all apps...")
    await close("apps");
    await close("plugins");
    await close("preload");
    log.info("Shutting down.")
    log.info(`\x1b[36m----------------------------------------------------\x1b[0m`)
    if (exit) {
        process.exit(0);
    }
}

module.exports = {
    gracefulShutdown
}