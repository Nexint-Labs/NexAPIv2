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

module.exports = {
    load
}