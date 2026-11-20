// Import the .env lol
const env = require('dotenv').config({ path: __dirname + '/.env' });
if (env === undefined) {
    log.error("No .env file was provided.");
    throw new Error("No env file exists lol please make it :)");
};

// Load configs (that actually matter)
const { frameVer, autoUpdate, frameID, updateSource, updateURL, frameName } = require('#config/core/core');
const { load, loadConsole, close } = require('#functions/core/load');
const { log } = require('#functions/core/log.mjs');
const delay = require("#functions/core/delay");

// Start loading
const startLoad = Date.now();

// Set the directory
try {
    process.chdir(__dirname);
} catch (error) {
    log.error("Could not set the directory.", error);
    throw new Error(error);
};

log.info("Starting Server");

// Make sure directories exist lol
const fs = require('node:fs');
const path = require('path');
const dirs = ["plugins", "preload", "console", "databases", "apps"];
dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        log.info(`Creating directory: ${dir}`);
        fs.mkdirSync(path.join(__dirname, dir));
    };
});

// Prepare the console
const readline = require('node:readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

// Windows specific patch im ticked off bro
// Screw you microsoft :sob:
if (process.platform === "win32") {
    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    });
}

// Is the console open?
let consoleOpen = true;

// Update Checking
const { date } = require('#functions/core/date');
const { getUpdateVersion } = require('#functions/core/update');
const updateCheck = async function () {
    let latestVersion = await getUpdateVersion();

    if (frameID < latestVersion) {
        log.warn(`You're running an outdated version of ${frameName}! (You are ${latestVersion - frameID} commits behind)`)
        log.warn(`Update now at ${updateURL} to make sure that ${frameName} has the latest security fixes!`)
        if ((latestVersion - frameID) >= 5) {
            log.warn(`You are over 5 commits behind. Update to the latest version as soon as possible.`)
        }
    } else if (latestVersion == 0) {
        log.warn("Update systems seem to be failing.")
    } else if (frameID > latestVersion) {
        log.warn(`You're running an experimental version of ${frameName}! (You are ${frameID - latestVersion} commits ahead)`)
        log.warn(`Here be dragons!~`)
    } else {
        log.success(`You're running the latest version of ${frameName}!`)
    }
}

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

// Export the app and wss
module.exports = {
    consoleOpen,
    startLoad,
    readline: rl,
    sourceDir: __dirname,
    getUpdateVersion,
    gracefulShutdown
}

// Sigint / Sigterm (real)
process.on('SIGINT', async () => {
    await gracefulShutdown("Ctrl-C", true)
})
process.on('SIGTERM', async () => {
    await gracefulShutdown("OS Termination", true)
})

/**
 * Main function
 * This is the main function that runs the entire backend.
 * what am i doing bro :sob:
 */
const main = async () => {

    // Load preload and plugins
    await load("preload");
    await load("plugins");

    // Load the apps (FINALLY?)
    // This makes my API super modular :)
    await load("apps");

    log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
    log.info(`                 Welcome to ${frameName}!                 `);
    log.info(`             You're running version: ${frameVer}             `);
    log.info("        Stay up to date for the best features.        ");
    log.info('\x1b[36m----------------------------------------------------\x1b[0m');
    log.success(`Done in ${(Date.now() - startLoad) / 1000} seconds!`)

    await updateCheck()

    // real?
    await asyncFunctions();
}

main();

/**
 * Async Functions
 * These functions are deliberately async'd
 */
const asyncFunctions = async function () {
    commandParser();
    if (autoUpdate) {
        autoUpdateCheck();
    } else {
        log.info( "Automatic update checking disabled.")
    }
}

/**
 * Command Parser
 * Parses commands
 */
const commandParser = async () => {
    while (consoleOpen) {
        const command = await prompt('');

        // Is this command valid?
        if (!(await loadConsole("console", command))) {
            log.info("This command is not valid.")
        }
    }
}

// Update checks - Asyncronously checks updates.
const autoUpdateCheck = async () => {
    while (consoleOpen) {
        await delay(3600000); // artificial delay to ensure host's CPU doesn't die
        updateCheck();
    }
}