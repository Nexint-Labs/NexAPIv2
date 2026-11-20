const { bank, currency } = require("#preload/db/currency");
const { Transaction } = require("sequelize");
const { log } = require("#functions/core/log.mjs");
const { getOptOut } = require("../optOut/optOutUser");

/**
 * Query or add a bank account.
 * Misleading name? yes, but I do not care lol
 * @param {String} userId 
 * @param {String} name 
 * @param {Transaction} t
 * @returns 
 */
const addBank = async function (userId, name, t) {
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

    const createBank = async function (userId, t) {

        // idk why im using find or create :sob:
        let [user, created] = await bank.findOrCreate({
            where: {
                userId: userId,
            },
            defaults: {
                name: name,
                value: 0,
                maxValue: 1,
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
            }
        );

        return [user, created]
    }

    // Transaction safety, outside try-catch because I want errors to propagate :)
    if (t) {
        let [user, created] = await createBank(userId, t)
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

            let [user, created] = await createBank(userId, t)

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
            title: "Created Bank.",
            desc: `${name} is now registered.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log.error("A server error has happened while trying to add someone to the bank.", error)
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
const delBank = async function (userId, name) {
    try {
        const result = await currency.transaction(async t => {

            const rowCount = await bank.destroy({
                where: {
                    userId: userId,
                },
                transaction: t
            })
            if (!rowCount) {
                return {
                    error: true,
                    status: 410,
                    title: "Gone",
                    desc: `${name} is not registered.`,
                    content: {
                        userId: userId,
                        name: name
                    },
                }
            }
            return {
                userId, name
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
            title: "Deleted Bank.",
            desc: `${name} has been unregisted.`,
            content: result,
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to remove someone from the bank.", error)
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
const getBank = async function (depth) {
    try {
        let banks;
        if (Number.isSafeInteger(depth)) {
            banks = await bank.findAll({
                order: [
                    ['value', 'DESC'],
                ],
                limit: depth
            });
        } else {
            banks = await bank.findAll({
                order: [
                    ['value', 'DESC'],
                ]
            });
        }

        return {
            error: false,
            status: 200,
            title: "Bank List",
            desc: `List of all bank accounts:`,
            content: banks
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to query the bank.", error)
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
    addBank,
    delBank,
    getBank,
}