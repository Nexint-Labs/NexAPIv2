const { Transaction, Op } = require("sequelize");
const { log } = require("#functions/core/log.mjs");
const { getOptOut } = require("../optOut/optOutUser");
const { action, fundb } = require("#preload/db/funDBs");

/**
 * Query or add an action.
 * Misleading name? yes, but I do not care lol
 * @param {String} userId 
 * @param {String} actionId 
 * @param {String} type 
 * @param {Transaction} t
 * @returns 
 */
const addAction = async function (userId, actionId, type, t) {
    const optOut = await getOptOut(userId, actionId);
    if (optOut.content === true) {
        return {
            error: true,
            status: 410,
            title: "Opted out.",
            desc: `Someone is opted out.`,
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

    const createAction = async function (userId, actionId, type, t) {

        // idk why im using find or create :sob:
        let [user, created] = await action.findOrCreate({
            where: {
                userId: userId,
                actionId: actionId,
                type: type,
            },
            defaults: {
                value: 0,
            },
            transaction: t
        })

        return [user, created]
    }

    // Transaction safety, outside try-catch because I want errors to propagate :)
    if (t) {
        let [user, created] = await createAction(userId, actionId, type, t)
        if (!created) {
            return {
                error: false,
                status: 200,
                title: "Already created.",
                desc: `${userId} and ${actionId} with type ${type} is already registered.`,
                content: user,
            };
        }
        return {
            error: false,
            status: 201,
            title: "Created Misc.",
            desc: `${userId} and ${actionId} with type ${type} is now registered.`,
            content: user,
        }
    }

    try {

        // Try to create the user
        const [result, created] = await fundb.transaction(async t => {

            let [user, created] = await createAction(userId, actionId, type, t)

            return [user, created];
        });

        if (!created) {
            return {
                error: false,
                status: 200,
                title: "Already created.",
                desc: `${userId} and ${actionId} with type ${type} is already registered.`,
                content: result,
            };
        }
        return {
            error: false,
            status: 201,
            title: "Created Bank.",
            desc: `${userId} and ${actionId} with type ${type} is now registered.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log.error("A server error has happened while trying to add someone to the actions DB.", error)
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
 * Delete an action?
 * @param {String} userId 
 * @param {String} actionId 
 * @param {String} type 
 * @returns 
 */
const delAction = async function (userId, actionId = null, type = null) {
    try {
        const result = await fundb.transaction(async t => {
            let rowCount;
            if (actionId === null) {
                rowCount = await action.destroy({
                    where: {
                        [Op.or]: [
                            { userId },
                            { actionId: userId }
                        ]
                    },
                    transaction: t
                });
                if (!rowCount) {
                    return {
                        error: true,
                        status: 404,
                        title: "Not Found",
                        desc: `${userId} is not registered.`,
                        content: {
                            userId: userId,
                        },
                    }
                }
                return {
                    userId,
                }
            }
            if (type === null) {
                rowCount = await action.destroy({
                    where: {
                        userId: userId,
                        actionId: actionId
                    },
                    transaction: t
                })
                if (!rowCount) {
                    return {
                        error: true,
                        status: 404,
                        title: "Not Found",
                        desc: `${userId} or ${actionId} is not registered.`,
                        content: {
                            userId: userId,
                            actionId: actionId
                        },
                    }
                }
                return {
                    userId,
                    actionId
                }
            } else {
                rowCount = await action.destroy({
                    where: {
                        userId: userId,
                        actionId: actionId,
                        type: type
                    },
                    transaction: t
                })
                if (!rowCount) {
                    return {
                        error: true,
                        status: 404,
                        title: "Not Found",
                        desc: `${userId} or ${actionId} with type ${type} is not registered.`,
                        content: {
                            userId: userId,
                            actionId: actionId,
                            type: type
                        },
                    }
                }
                return {
                    userId,
                    actionId,
                    type
                }
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
            title: "Deleted Action.",
            desc: `${userId} and ${actionId} has been unregisted.`,
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
 * Gets all actions
 * @param {Number} depth 
 * @param {String} type 
 * @returns 
 */
const getAction = async function (depth, type = null) {
    try {
        let actions;
        if (Number.isSafeInteger(depth)) {
            if (type === null) {
                actions = await action.findAll({
                    order: [
                        ['value', 'DESC'],
                    ],
                    limit: depth
                });
            } else {
                actions = await action.findAll({
                    order: [
                        ['value', 'DESC'],
                    ],
                    where: {
                        type: type
                    },
                    limit: depth
                });
            }
        } else {
            if (type === null) {
                actions = await action.findAll({
                    order: [
                        ['value', 'DESC'],
                    ],
                });
            } else {
                actions = await action.findAll({
                    order: [
                        ['value', 'DESC'],
                    ],
                    where: {
                        type: type
                    },
                });
            }
        }

        return {
            error: false,
            status: 200,
            title: "Action List",
            desc: `List of all actions:`,
            content: actions
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to query the actions DB.", error)
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
    addAction,
    delAction,
    getAction
}