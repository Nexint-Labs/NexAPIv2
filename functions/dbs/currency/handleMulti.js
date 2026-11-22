const { multi, currency } = require("#preload/db/currency");
const { Transaction } = require("sequelize");
const { log } = require("#functions/core/log.mjs");
const { getOptOut } = require("../optOut/optOutUser");
const { jobs, choiceCount } = require("#config/eco/currency");

/**
 * Query or add a multiplier.
 * Misleading name? yes, but I do not care lol
 * @param {String} userId 
 * @param {String} name // This is NOT THE USERS NAME! BE WARNED!
 * @param {String} value // this isnt even necessary what am i doing
 * @param {String} multiplier 
 * @param {Number} expire // Note: this expiry is a number in ms.
 * @param {Transaction} t
 * @returns 
 */
const addMulti = async function (userId, name, value, multiplier, expire, t) {
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

    const createMulti = async function (userId, name, multiplier, expire, t) {

        // idk why im using find or create :sob:
        let [user, created] = await multi.findOrCreate({
            where: {
                userId: userId,
                name: name,
            },
            defaults: {
                name: name,
                value: value,
                multi: multiplier,
                expire: Date.now() + expire
            },
            transaction: t
        })


        if (!created) {
            await user.update(
                {
                    expire: Math.max(Date.now(), Number(user.expire)) + expire,
                    value: value,
                    multi: multiplier,
                },
                {
                    transaction: t
                }
            );
        }

        return [user, created]
    }

    // Transaction safety, outside try-catch because I want errors to propagate :)
    if (t) {
        let [user, created] = await createMulti(userId, name, multiplier, expire, t)
        if (!created) {
            return {
                error: false,
                status: 200,
                title: "Already created.",
                desc: `${name} is already registered.`,
                content: user,
            };
        }
        return {
            error: false,
            status: 201,
            title: "Created Multi.",
            desc: `${name} is now registered.`,
            content: user,
        }
    }

    try {

        // Try to create the user
        const [result, created] = await currency.transaction(async t => {

            let [user, created] = await createMulti(userId, name, multiplier, expire, t)

            return [user, created];
        });

        if (!created) {
            return {
                error: false,
                status: 200,
                title: "Already created.",
                desc: `${name} is already registered.`,
                content: result,
            };
        }
        return {
            error: false,
            status: 201,
            title: "Created Multi.",
            desc: `${name} is now registered.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log.error("A server error has happened while trying to multiply.", error)
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
 * Delete a multiplier?
 * @param {String} userId 
 * @param {String} name // optional
 * @param {Transaction} t // Note: This is optional.
 * @returns 
 */
const delMulti = async function (userId, name = null, t) {
    const processDelete = async function (userId, name, t) {
        if (name === null) {

            const rowCount = await multi.destroy({
                where: {
                    userId: userId,
                },
                transaction: t
            })
            return rowCount

        }

        const rowCount = await multi.destroy({
            where: {
                userId: userId,
                name: name,
            },
            transaction: t
        })
        return rowCount

    }

    if (t) {
        const deleted = await processDelete(userId, name, t)
        if (!deleted) {
            return {
                error: true,
                status: 404,
                title: "Not Found",
                desc: `${name} is not registered in ${userId}.`,
                content: {
                    userId: userId,
                    name: name
                },
            }
        }

        return {
            error: false,
            status: 200,
            title: "Deleted Multi.",
            desc: `${name} from ${userId} has been unregisted.`,
            content: {
                userId: userId,
                name: name
            },
        }

    }
    try {
        const result = await currency.transaction(async t => {
            return await processDelete(userId, name, t);
        });

        if (!result) {
            return {
                error: true,
                status: 404,
                title: "Not Found",
                desc: `${name} is not registered in ${userId}.`,
                content: null,
            };
        }

        return {
            error: false,
            status: 200,
            title: "Deleted Multi.",
            desc: `${name} from ${userId} has been unregistered.`,
            content: null,
        };
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to remove someone from working.", error)
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
 * Gets multipliers and cleans them up.
 * @param {String} userId 
 * @param {Transaction} t // Note: This is optional.
 * @returns 
 */
const getMulti = async function (userId, t) {
    const fetchMulti = async function (userId, t) {
        let error = false;
        let status = 200;
        let title = "Multiplier List";
        let desc = `List of all multipliers for ${userId}:`
        const multis = await multi.findAll({
            where: {
                userId: userId
            },
            transaction: t
        })

        let total = 1;

        for (const multi of multis) {
            if (multi.expire < Date.now()) {
                const result = await delMulti(userId, multi.name, t)
                if (result.error) {
                    error = true;
                    status = result.status;
                    title = result.title;
                    desc = result.desc
                }
            } else {
                total *= multi.multi

            }
        }
        return {
            error,
            status,
            title,
            desc,
            total,
        };
    }

    // Transaction support?
    if (t) {
        const result = await fetchMulti(userId, t)
        return {
            error: result.error,
            status: result.status,
            title: result.title,
            desc: result.desc,
            content: result.total
        }
    }

    try {
        const result = await currency.transaction(async t => {
            return await fetchMulti(userId, t)
        })
        return {
            error: result.error,
            status: result.status,
            title: result.title,
            desc: result.desc,
            content: result.total
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to query multipliers.", error)
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
    addMulti,
    delMulti,
    getMulti,
}