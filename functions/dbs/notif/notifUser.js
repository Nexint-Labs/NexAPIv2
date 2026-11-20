const { log } = require("#functions/core/log.mjs");
const { notifyDB, userNotify, devNotify, botNotify } = require("#preload/db/notif");
const { getOptOut } = require("../optOut/optOutUser");

/**
 * Adds a notification user, or queries them.
 * May or may not refresh.
 * @param {String} userId 
 * @param {Boolean} refresh
 * @returns 
 */
const addNotif = async function (userId, refresh = false, t = null) {
    const optOut = await getOptOut(userId);
    if (optOut.content === true) {
        return {
            error: true,
            status: 410,
            title: "Opted out.",
            desc: `${userId} is opted out.`,
            content: null,
        };
    } else if (optOut.content === null) {
        return {
            error: optOut.error,
            status: optOut.status,
            title: optOut.title,
            desc: optOut.desc,
            content: null,
        };
    }

    const createUser = async function (userId, t) {
        let [user, created] = await userNotify.findOrCreate({
            where: {
                userId: userId
            },
            defaults: {
                date: Date.now()
            },
            transaction: t
        })

        // Update the notification lol
        if (refresh) {
            await user.update(
                {
                    date: Date.now()
                },
                {
                    where: {
                        userid: userId,
                    },
                    transaction: t
                },
            );

        }

        return [user, created];

    }

    // Transaction safety, outside try-catch because I want errors to propagate :)
    if (t) {
        let [user, created] = await createUser(userId, t)
        return user
    }

    try {

        // Try to create the user
        const result = await notifyDB.transaction(async t => {

            // idk why im using find or create :sob:
            let [user, created] = await createUser(userId, t)

            if (!created) {
                return {
                    error: true,
                    status: 409,
                    title: "Conflict",
                    desc: `${userId} is already registered.`,
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
            title: "Registered User.",
            desc: `${userId} is now registered.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log.error("A server error has happened while trying to register a user.", error)
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
 * Deletes a notify user.
 * @param {String} userId 
 * @returns 
 */
const delNotif = async function (userId) {
    try {
        const result = await notifyDB.transaction(async t => {

            const rowCount = await userNotify.destroy({
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
                    desc: `${userId} is already gone.`,
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
            title: "Deleted User.",
            desc: `${userId} has been unregistered.`,
            content: result,
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to query notifications for a user.", error)
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
 * Gets all notifications for a user. May or may not refresh.
 * @param {String} userId 
 * @param {Boolean} refresh
 * @param {Boolean} viewAll
 * @returns 
 */
const getNotif = async function (userId, refresh, viewAll = false) {
    const optOut = await getOptOut(userId);
    if (optOut.content === true) {
        return {
            error: true,
            status: 410,
            title: "Opted out.",
            desc: `${userId} is opted out.`,
            content: null,
        };
    } else if (optOut.content === null) {
        return {
            error: optOut.error,
            status: optOut.status,
            title: optOut.title,
            desc: optOut.desc,
            content: null,
        };
    }

    try {
        const notifs = await notifyDB.transaction(async t => {
            const user = await addNotif(userId, refresh, t);

            const notifArray = [];

            // List the notifications
            const devNotifs = await devNotify.findAll({
                order: [
                    ['date', 'DESC'],
                ],
                transaction: t
            });
            const botNotifs = await botNotify.findAll({
                order: [
                    ['date', 'DESC'],
                ],
                where: {
                    userId: userId
                },
                transaction: t
            });

            // Build the notifications array
            for (let i = 0; i < devNotifs.length; i++) {
                if (user.date < devNotifs[i].date || viewAll) {
                    notifArray.push(devNotifs[i]);
                }
            }
            for (let i = 0; i < botNotifs.length; i++) {
                if (user.date < botNotifs[i].date || viewAll) {
                    notifArray.push(botNotifs[i]);
                }
            }

            return notifArray
        })

        return {
            error: false,
            status: 200,
            title: "Notifications",
            desc: `Notifications for user ${userId}`,
            content: notifs
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to unregister a user.", error)
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
    addNotif,
    delNotif,
    getNotif,
}