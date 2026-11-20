const { log } = require("#functions/core/log");
const { optOut, optOutDb } = require("#preload/db/optOut");
const { Op } = require("sequelize");

/**
 * Queries if they are opted in?
 * @param {String} userId 
 * @returns 
 */
const getOptOut = async function (userId, secondId = null) {
    try {
        let result;
        if (secondId) {
            result = await optOut.findOne({
                where: {
                    [Op.or]: [
                        {
                            userId: userId
                        },
                        {
                            userId: secondId
                        },
                    ]
                }
            })
        } else {
            result = await optOut.findOne({
                where: {
                    userId: userId
                }
            })
        }

        if (result !== null) {
            return {
                error: false,
                status: 200,
                title: "Opt Out",
                desc: `Someone is opted out.`,
                content: true
            }
        } else {
            return {
                error: false,
                status: 200,
                title: "Opt Out",
                desc: `Someone is opted in.`,
                content: false
            }
        }
    } catch (error) {
        // Some error has occured lol
        log("ERROR", "A server error has happened while trying to query the opt out DB.")
        console.error(error)
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
 * Opts out a user and DELETES ALL INFO ASSOCIATED HELP
 * @param {String} userId 
 * @returns 
 */
const addOptOut = async function (userId, name) {

    try {

        // Try to create the user
        const result = await optOutDb.transaction(async t => {

            // idk why im using find or create :sob:
            let [user, created] = await optOut.findOrCreate({
                where: {
                    userId: userId
                },
                transaction: t
            })

            // Update the notification lol
            const { delBalance } = require("../currency/handleBalance");
            const { delBank } = require("../currency/handleBank");
            const { delNotif } = require("../notif/notifUser");
            const { delMisc } = require("../currency/handleMisc");

            await delNotif(userId);
            await delBalance(userId, name);
            await delBank(userId, name);
            await delMisc(userId, name);

            if (!created) {
                return {
                    error: true,
                    status: 409,
                    title: "Conflict",
                    desc: `${userId} is already opted out..`,
                    content: {
                        userId: userId
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
            title: "Opted Out User.",
            desc: `${userId} is now opted out.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log("ERROR", "A server error has happened while trying to opt out a user.")
        console.error(error)
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
 * Opts a user back in.
 * @param {String} userId 
 * @returns 
 */
const delOptOut = async function (userId) {
    try {
        const result = await optOutDb.transaction(async t => {

            const rowCount = await optOut.destroy({
                where: {
                    userId: userId
                },
                transaction: t
            })
            if (!rowCount) {
                return {
                    error: true,
                    status: 410,
                    title: "Gone",
                    desc: `${userId} is already opted in.`,
                    content: {
                        userId: userId
                    },
                }
            }
            return {
                userId: userId
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
            title: "Opted In.",
            desc: `${userId} has been opted in.`,
            content: result,
        }
    } catch (error) {
        // Some error has occured lol
        log("ERROR", "A server error has happened while trying to opt in a user.")
        console.error(error)
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
    addOptOut,
    delOptOut,
    getOptOut,
}