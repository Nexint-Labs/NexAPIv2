const fs = require("node:fs");
const path = require('path');
const { log } = require("./log.mjs");
const { verbose } = require("#config/core/core");


/**
 * Load files in a specific directory.
 * This runs the execute function.
 * @param {String} dir 
 */
const load = async function (dir) {

    const files = fs.readdirSync(path.join(process.cwd(), dir), { recursive: true });
    for (const file of files) {

        // Only load JS files (trust)
        if (file.includes(".js")) {

            // Execute the plugin?
            const plugin = require(path.join(process.cwd(), dir, file));
            if ('execute' in plugin && !('data' in plugin)) { // Discord fix lol
                try {
                    await plugin.execute();
                    if (verbose) {
                        log.info(`Loaded file: ${path.join(dir, file)}`)
                    }
                } catch (error) {
                    log.error("Failed to load files.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                    throw new Error("File loading failed.");
                }
            }
        }
    }
}

/**
 * Load console files
 * This runs the console function.
 * @param {String} dir 
 * @param {String} command 
 */
const loadConsole = async function (dir, command) {

    let validCommand = false;

    const files = fs.readdirSync(path.join(process.cwd(), dir), { recursive: true });
    for (const file of files) {

        // Only load JS files (trust)
        if (file.includes(".js")) {

            // Load the console command?
            const console = require(path.join(process.cwd(), dir, file));
            if ('command' in console) {
                try {
                    validCommand = await console.command(command);
                    if (verbose) {
                        log.info(`Loaded file: ${path.join(dir, file)}`)
                    }
                } catch (error) {
                    log.error("Failed to load console files.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                    throw new Error("File loading failed.");
                }
            }
            if(validCommand){
                return true
            }
        }
    }
    return false;
}

/**
 * Load help menu.
 * This is meant to run dynamically.
 * @param {String} dir 
 */
const loadHelp = async function (dir) {

    let helpArray = [];

    const files = fs.readdirSync(path.join(process.cwd(), dir), { recursive: true });
    for (const file of files) {

        // Only load JS files (trust)
        if (file.includes(".js")) {

            // Load the help menu?
            const help = require(path.join(process.cwd(), dir, file));
            if ('help' in help) {
                try {
                    helpArray = helpArray.concat(await help.help())
                } catch (error) {
                    log.error("Failed to load help menu.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                    throw new Error("File loading failed.");
                }
            }
        }
    }
    return helpArray;
}

/**
 * Close everything (shut it all down) safely.
 * @param {String} dir 
 */
const close = async function (dir) {

    let success = true;

    const files = fs.readdirSync(path.join(process.cwd(), dir), { recursive: true });
    for (const file of files) {

        // Only load JS files (trust)
        if (file.includes(".js")) {

            // Load the help menu?
            const app = require(path.join(process.cwd(), dir, file));
            if ('close' in app) {
                try {
                    await app.close()
                    if (verbose) {
                        log.info(`Closed file: ${path.join(dir, file)}`)
                    }
                } catch (error) {
                    log.error("Failed to close app.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                    success = false
                }
            }
        }
    }
    return success;
}

module.exports = {
    load,
    loadConsole,
    loadHelp,
    close
}