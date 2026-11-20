const { updateSource, updateURL } = require("#config/core/core");

/**
 * Gets the latest version of this bot!
 * @returns 
 */
const getUpdateVersion = async function () {
    try {
        const update = await fetch(updateSource);
        const tmp = await update.text();
        const version = Number(tmp)
        if (!Number.isNaN(version)) {
            return version
        } else {
            throw new Error("Not a Number.")
        }
    } catch (error) {
        console.log(updateURL)
        log("ERROR", "An error happened while trying to check for updates!")
        log("ERROR", "Likely caused by the bot being unable to access Github. Full stack trace:")
        console.error(error);
        return 0;
    }
};

module.exports = {
    getUpdateVersion
}