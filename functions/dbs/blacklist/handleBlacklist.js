const { log } = require("#functions/core/log.mjs");
const { analytics, blacklist } = require("#preload/db/analytics");

/**
 * Add a member to the Nexint Blacklist.
 * @param {String} userId 
 * @param {String} name 
 * @returns 
 */
const addBlacklist = async function (userId, name) {
    try {

        // Try to create the user
        const result = await analytics.transaction(async t => {

            // idk why im using find or create :sob:
            let [user, created] = await blacklist.findOrCreate({
                where: {
                    userid: userId,
                },
                defaults: {
                    user: name,
                    timeStamp: Math.round(Date.now() / 1000),
                },
                transaction: t
            })

            if (!created) {
                return {
                    error: true,
                    status: 409,
                    title: "Conflict",
                    desc: `${name} is already blacklisted.`,
                    content: user,
                };
            }

            // Update the username lol
            await user.update(
                {
                    user: name
                },
                {
                    where: {
                        userid: userId,
                    },
                    transaction: t
                },
            );

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
            title: "Created Blacklist.",
            desc: `${name} is now blacklisted.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log.error("A server error has happened while trying to add people to the blacklist.", error)
        return {
            error: true,
            status: 500,
            title: "Server Error",
            desc: "The server in question has faced a serious server error.",
            content: null
        }
    }
}

/**
 * Deletes a user from the blacklist.
 * @param {String} userId 
 * @param {String} name 
 * @returns 
 */
const delBlacklist = async function (userId, name) {
    try {
        const result = await analytics.transaction(async t => {

            const rowCount = await blacklist.destroy({
                where: {
                    userid: userId,
                },
                transaction: t
            })
            if (!rowCount) {
                return {
                    error: true,
                    status: 404,
                    title: "Not Found",
                    desc: `${name} is not blacklisted.`,
                    content: {
                        userid: userId,
                        user: name
                    },
                }
            }
            return {
                userid: userId,
                user: name
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
            title: "Deleted Blacklist.",
            desc: `${name} has been removed from the blacklist.`,
            content: result,
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to remove someone from a blacklist.", error)
        return {
            error: true,
            status: 500,
            title: "Server Error",
            desc: "The server in question has faced a serious server error.",
            content: null
        }
    }
}

/**
 * Gets all blacklists.
 * @returns 
 */
const getBlacklist = async function () {
    try {
        const blacklists = await blacklist.findAll();

        return {
            error: false,
            status: 200,
            title: "Blacklist List",
            desc: `List of all blacklists:`,
            content: blacklists
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to query blacklists.", error)
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
    addBlacklist,
    delBlacklist,
    getBlacklist,
}