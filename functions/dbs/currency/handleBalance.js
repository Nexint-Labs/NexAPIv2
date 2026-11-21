const { balance, currency } = require("#preload/db/currency");
const { Transaction } = require("sequelize");
const { log } = require("#functions/core/log.mjs");
const { getOptOut } = require("../optOut/optOutUser");

/**
 * Query or add a balance.
 * Misleading name? yes, but I do not care lol
 * @param {String} userId 
 * @param {String} name 
 * @param {Transaction} t
 * @returns 
 */
const addBalance = async function (userId, name, t) {
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

    const createBal = async function (userId, t) {

        // why find or create
        let [user, created] = await balance.findOrCreate({
            where: {
                userId: userId,
            },
            defaults: {
                name: name,
                value: 0,
                multiplier: 1,
            },
            transaction: t
        })

        // Update the username lol
        await user.update(
            {
                name: name
            },
            {
                where: {
                    userId: userId,
                },
                transaction: t
            },
        );

        return [user, created]
    }

    // Transaction safety, outside try-catch because I want errors to propagate :)
    if (t) {
        let [user, created] = await createBal(userId, t)
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
            title: "Created Misc.",
            desc: `${name} is now registered.`,
            content: user,
        }
    }

    try {

        // Try to create the user
        const [result, created] = await currency.transaction(async t => {
            let [user, created] = await createBal(userId, t)

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
            title: "Created Balance.",
            desc: `${name} is now registered.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log.error("A server error has happened while trying to add someone to the balance.", error)
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
 * Delete a balance?
 * @param {String} userId 
 * @param {String} name 
 * @returns 
 */
const delBalance = async function (userId, name) {
    try {
        const result = await currency.transaction(async t => {

            const rowCount = await balance.destroy({
                where: {
                    userId: userId,
                },
                transaction: t,
            })
            if (!rowCount) {
                return {
                    error: true,
                    status: 404,
                    title: "Not Found",
                    desc: `${name} is not registered.`,
                    content: {
                        userId: userId,
                        name: name
                    },
                }
            }

            return {
                userId: userId,
                name: name
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
            title: "Deleted Balance.",
            desc: `${name} has been unregisted.`,
            content: result,
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to remove someone to the balance.", error)
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
 * Gets all balances
 * @param {Number} depth 
 * @returns 
 */
const getBalance = async function (depth) {
    try {
        let balances;
        if (Number.isSafeInteger(depth)) {
            balances = await balance.findAll({
                order: [
                    ['value', 'DESC'],
                ],
                limit: depth
            });
        } else {
            balances = await balance.findAll({
                order: [
                    ['value', 'DESC'],
                ]
            });
        }

        return {
            error: false,
            status: 200,
            title: "Balance List",
            desc: `List of balance accounts:`,
            content: balances
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to query the balance.", error)
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
    addBalance,
    delBalance,
    getBalance,
}