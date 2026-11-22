
const { items, currency } = require("#preload/db/currency");
const { Transaction } = require("sequelize");
const { log } = require("#functions/core/log.mjs");
const { getOptOut } = require("../optOut/optOutUser");

/**
 * Query or add an item.
 * Misleading name? yes, but I do not care lol
 * @param {String} userId
 * @param {String} name
 * @param {Transaction} t
 * @returns
 */
const addItem = async function (userId, name, t) {
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

    const createItem = async function (userId, t) {

        // idk why im using find or create :sob:
        let [user, created] = await items.findOrCreate({
            where: {
                userId: userId,
                name: name,
            },
            defaults: {
                name: name,
                value: 0,
            },
            transaction: t
        })

        return [user, created]
    }

    // Transaction safety, outside try-catch because I want errors to propagate :)
    if (t) {
        let [user, created] = await createItem(userId, t)
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
            title: "Created Item.",
            desc: `${name} is now registered.`,
            content: user,
        }
    }

    try {

        // Try to create the item
        const [result, created] = await currency.transaction(async t => {

            let [user, created] = await createItem(userId, t)

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
            title: "Created Item.",
            desc: `${name} is now registered.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log.error("A server error has happened while trying to add an item.", error)
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
 * Delete an item?
 * @param {String} userId
 * @param {String} name
 * @returns
 */
const delItem = async function (userId, name) {
    try {
        const result = await currency.transaction(async t => {

            const rowCount = await items.destroy({
                where: {
                    userId: userId,
                    name: name,
                },
                transaction: t
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
                userId,
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
            title: "Deleted Item.",
            desc: `${name} has been unregistered.`,
            content: result,
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to remove an item.", error)
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
 * Gets all items for a user
 * @param {String} userId
 * @returns
 */
const getItems = async function (userId) {
    try {
        let inventory = await items.findAll({
            where: {
                userId: userId,
            },
            order: [
                ['value', 'DESC'],
            ]
        });

        return {
            error: false,
            status: 200,
            title: "Item List",
            desc: `List of all items for ${userId}:`,
            content: inventory
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to query items.", error)
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
 * Change your item quantity!
 * @param {String} userId
 * @param {String} name
 * @param {Number} amount
 * @param {Transaction} t
 * @param {Boolean} forced
 * @param {Number} required // If the user doesn't have at least this amount, reject.
 * @returns
 */
const updateItem = async function (userId, name, amount, t, forced, required) {

    if (typeof amount !== "number" || !Number.isFinite(amount)) {
        return {
            error: true,
            status: 400,
            title: "Invalid Amount",
            desc: "The item adjustment must be a finite number.",
            content: null,
        };
    }

    const processUpdate = async function (userId, amount, t, forced, required) {
        const bal = await addItem(userId, name, t);

        if (bal.error) {
            return {
                error: true,
                status: bal.status,
                title: bal.title,
                desc: bal.desc,
                content: bal.content,
            };
        }

        const user = bal.content

        if (required !== undefined && (!Number.isFinite(required) || required < 0)) {
            return {
                error: true,
                status: 400,
                title: "Invalid Amount",
                desc: "Required item quantity does not exist.",
                content: user,
            };

        }

        // if the value is less than zero
        if (user.value + amount < 0 || (required !== undefined && user.value - required < 0)) {
            if (forced) {
                await user.update({
                    value: 0
                }, {
                    transaction: t
                })
            } else {
                return {
                    error: true,
                    status: 402,
                    title: "Item Quantity Too Low",
                    desc: "You do not have enough items.",
                    content: user,
                };

            }
        } else {

            await user.increment('value', {
                by: amount,
                transaction: t
            });

        }
        await user.reload({
            transaction: t,
        });
        return {
            error: false,
            user,
        }
    }

    // Transaction safety, outside try-catch because I want errors to propagate :)
    if (t) {
        const result = await processUpdate(userId, amount, t, forced, required)
        if (result.error) {
            return {
                error: true,
                status: result.status,
                title: result.title,
                desc: result.desc,
                content: result.content,
            };
        }

        return {
            error: false,
            status: 200,
            title: "Updated Item.",
            desc: `${name} has been updated.`,
            content: result.user,
        }
    }
    try {

        const result = await currency.transaction(async t => {
            return await processUpdate(userId, amount, t, forced, required)
        })

        if (result.error) {
            return {
                error: true,
                status: result.status,
                title: result.title,
                desc: result.desc,
                content: result.content,
            };

        }

        return {
            error: false,
            status: 200,
            title: "Updated Item.",
            desc: `${name} has been updated.`,
            content: result.user,
        }
    } catch (error) {

        log.error("A server error has happened while trying to update an item.", error)
        return {
            error: true,
            status: 500,
            title: "Server Error",
            desc: "The server in question has faced a serious server error.",
            content: null
        }

    }
}

module.exports = {
    addItem,
    delItem,
    getItems,
    updateItem
}
