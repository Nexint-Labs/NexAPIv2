// Import the .env lol
const env = require('dotenv').config({ path: __dirname + '/.env' });
if (env === undefined) {
    log("CRITICAL", "No .env file was provided.");
    throw new Error("No env file exists lol please make it :)");
};

// Load configs (that actually matter)
const { frameVer, autoUpdate, frameID, updateSource, updateURL, frameName } = require('#config/core/core');
const { load, loadConsole, close } = require('#functions/core/load');
const { log } = require('#functions/core/log');
const delay = require("#functions/core/delay");

// Start loading
const startLoad = Date.now();

// Set the directory
try {
    process.chdir(__dirname);
} catch (error) {
    log("CRITICAL", "Could not set the directory.");
    throw new Error(error);
};

log("INFO", "Starting Server");

// Make sure directories exist lol
const fs = require('node:fs');
const path = require('path');
const dirs = ["plugins", "preload", "console", "databases", "apps"];
dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        log("INFO", `Creating directory: ${dir}`);
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
        log("WARN", `You're running an outdated version of ${frameName}! (You are ${latestVersion - frameID} commits behind)`)
        log("WARN", `Update now at ${updateURL} to make sure that ${frameName} has the latest security fixes!`)
        if ((latestVersion - frameID) >= 5) {
            log(`You are over 5 commits behind. Update to the latest version as soon as possible.`)
        }
    } else if (latestVersion == 0) {
        log("WARN", "Update systems seem to be failing.")
    } else if (frameID > latestVersion) {
        log("WARN", `You're running an experimental version of ${frameName}! (You are ${frameID - latestVersion} commits ahead)`)
        log("WARN", `Here be dragons!~`)
    } else {
        log("INFO", `You're running the latest version of ${frameName}!`)
    }
}

/**
 * Graceful Shutdown of bot
 * Exit: Determines if the process exits immediately or not.
 * @param {String} cause 
 * @param {Boolean} exit 
 */
const gracefulShutdown = async function (cause, exit) {
    log("INFO", `\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
    log("INFO", `Shutdown triggered by: ${cause}`)
    log("INFO", "Closing all apps...")
    await close("apps");
    await close("plugins");
    await close("preload");
    log("INFO", "Shutting down.")
    log("INFO", `\x1b[36m----------------------------------------------------\x1b[0m`)
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

    log("INFO", `\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
    log("INFO", `                 Welcome to ${frameName}!                 `);
    log("INFO", `             You're running version: ${frameVer}             `);
    log("INFO", "        Stay up to date for the best features.        ");
    log("INFO", '\x1b[36m----------------------------------------------------\x1b[0m');
    log("INFO", `Done in ${(Date.now() - startLoad) / 1000} seconds!`)

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
        log("INFO", "Automatic update checking disabled.")
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
            log("INFO", "This command is not valid.")
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