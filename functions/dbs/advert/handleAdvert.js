const { frameName } = require("#config/core/core");
const { analytics, advert } = require("#preload/db/analytics");
const { log } = require("#functions/core/log.mjs");

/**
 * Adds an advertisement.
 * @param {String} name 
 * @returns 
 */
const addAdvert = async function (name) {
    try {

        // Try to create the user
        const result = await analytics.transaction(async t => {

            // idk why im using find or create :sob:
            let [user, created] = await advert.findOrCreate({
                where: {
                    name: name
                },
                transaction: t
            })

            if (!created) {
                return {
                    error: true,
                    status: 409,
                    title: "Conflict",
                    desc: `${name} is already an advertisement.`,
                    content: {
                        name: name
                    },
                };
            }

            return user;
        });

        if (result.error) {

            // So JS doesnt get mad at me lol
            return {
                error: true,
                status: result.status,
                title: result.title,
                desc: result.desc,
                content: result.content,
            }
        }
        return {
            error: false,
            status: 201,
            title: "Created Advertisement.",
            desc: `${name} is now being advertised across ${frameName}.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log.error("A server error has happened while trying to add an advertisement.", error)
        return {
            error: true,
            status: 500,
            title: "Server Error",
            desc: "The server in question has faced a serious server error.",
            content: null,
        }
    }
}

/**
 * Deletes an advertisement.
 * @param {String} name 
 * @returns 
 */
const delAdvert = async function (name) {
    try {
        const result = await analytics.transaction(async t => {

            const rowCount = await advert.destroy({
                where: {
                    name: name
                },
                transaction: t
            })
            if (!rowCount) {
                return {
                    error: true,
                    status: 404,
                    title: "Not Found",
                    desc: `${name} is already gone.`,
                    content: null,
                }
            }
            return {
                name
            }
        })

        if (result.error) {

            // So JS doesnt get mad at me lol
            return {
                error: true,
                status: result.status,
                title: result.title,
                desc: result.desc,
                content: result.content,
            }
        }

        return {
            error: false,
            status: 200,
            title: "Deleted Advertisement.",
            desc: `${name} has been removed from advertisements.`,
            content: result,
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to delete an advertisement.", error)
        return {
            error: true,
            status: 500,
            title: "Server Error",
            desc: "The server in question has faced a serious server error.",
            content: null,
        }
    }
}

/**
 * Gets all advertisements.
 * @returns 
 */
const getAdvert = async function () {
    try {
        const adverts = await advert.findAll();

        return {
            error: false,
            status: 200,
            title: "Advertisement List",
            desc: `List of all advertisements:`,
            content: adverts
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to query the advertisement API.", error)
        return {
            error: true,
            status: 500,
            title: "Server Error",
            desc: "The server in question has faced a serious server error.",
            content: null,
        }

    }
}

module.exports = {
    addAdvert,
    delAdvert,
    getAdvert,
}