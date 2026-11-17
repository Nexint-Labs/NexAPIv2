const fs = require("node:fs");
const path = require('path');
const { log } = require("#functions/core/log");
const { verbose } = require("#config/core");


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
            if ('execute' in plugin) {
                try {
                    await plugin.execute();
                    if (verbose) {
                        log("INFO", `Loaded file: ${path.join(dir, file)}`)
                    }
                } catch (error) {
                    log("ERROR", "Failed to load files.")
                    log("ERROR", `Problematic file: ${path.join(dir, file)}`)
                    throw new Error(error);
                }
            }
        }
    }
}

/**
 * Load console files
 * This runs the execute function.
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
                        log("INFO", `Loaded file: ${path.join(dir, file)}`)
                    }
                } catch (error) {
                    log("ERROR", "Failed to load files.")
                    log("ERROR", `Problematic file: ${path.join(dir, file)}`)
                    throw new Error(error);
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
                    log("ERROR", "Failed to load help menus.")
                    log("ERROR", `Problematic file: ${path.join(dir, file)}`)
                    throw new Error(error);
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
                    app.close()
                } catch (error) {
                    log("ERROR", "Failed to close apps.")
                    log("ERROR", `Problematic file: ${path.join(dir, file)}`)
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