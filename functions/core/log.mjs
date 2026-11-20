import core from "#config/core/core";
import chalk from "chalk"
const { dateOptions } = core;
const DateFormatter = new Intl.DateTimeFormat(undefined, dateOptions)
let infoCount = 0;
let successCount = 0;
let warnCount = 0;
let errorCount = 0;
const log = {

    /**
     * Info event
     * @param {String} text 
     */
    info: function (text) {
        console.log(`[INFO] [${DateFormatter.format(Date.now())}] ${text}`);
        infoCount += 1;
    },

    /**
     * Successful event!
     * @param {String} text 
     */
    success: function (text) {
        console.log(chalk.green(`[SUCCESS] [${DateFormatter.format(Date.now())}] ${text}`));
        successCount += 1;
    },

    /**
     * Warning event
     * @param {String} text 
     */
    warn: function (text) {
        console.log(chalk.yellow(`[WARN] [${DateFormatter.format(Date.now())}] ${text}`));
        warnCount += 1;
    },

    /**
     * Error event
     * @param {String} text 
     * @param {Error} error 
     */
    error: function (text, error) {
        console.error(chalk.red(`[ERROR] [${DateFormatter.format(Date.now())}] ${text}`));
        if (error) {
            console.error(error)
        }
        errorCount += 1;
    },
}

const getInfo = function(){
    return infoCount
}
const getSuccess = function(){
    return successCount
}
const getWarn = function(){
    return warnCount
}
const getError = function(){
    return errorCount
}

export { log, getInfo, getSuccess, getWarn, getError };