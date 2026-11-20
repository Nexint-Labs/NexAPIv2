const { miscinfo, currency } = require("#preload/db/currency");
const { Transaction } = require("sequelize");
const { log } = require("#functions/core/log");
const { getOptOut } = require("../optOut/optOutUser");

/**
 * Query or add Misc?
 * Misleading name? yes, but I do not care lol
 * @param {String} userId 
 * @param {String} name 
 * @param {Transaction} t
 * @returns 
 */
const addMisc = async function (userId, name, t) {

    const optOut = await getOptOut(userId);
    if (optOut === true) {
        return {
            error: true,
            status: 410,
            title: "Opted out.",
            desc: `${name} is opted out.`,
            content: null,
        };
    } else if (optOut === null) {
        return {
            error: optOut.error,
            status: optOut.status,
            title: optOut.title,
            desc: optOut.desc,
            content: null,
        };
    }

    const createMisc = async function (userId, t) {

        // idk why im using find or create :sob:
        let [user, created] = await miscinfo.findOrCreate({
            where: {
                userId: userId,
            },
            defaults: {
                name: name,
                exp: 0,
                level: 1,
                nextLevel: 5,
                lastRobbed: '0',
                robbable: true
            },
            transaction: t
        })

        return [user, created]
    }

    // Transaction safety, outside try-catch because I want errors to propagate :)
    if (t) {
        let [user, created] = await createMisc(userId, t)
        if (created) {
            return {
                error: true,
                status: 409,
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
        const result = await currency.transaction(async t => {
            let [user, created] = await createMisc(userId, t)

            if (created) {
                return {
                    error: true,
                    status: 409,
                    title: "Already created.",
                    desc: `${name} is already registered.`,
                    content: user,
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
            title: "Created Misc.",
            desc: `${name} is now registered.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log("ERROR", "A server error has happened while trying to add people to misc.")
        console.error(error)
        if(t){
            throw new Error("Creating misc failed.")
        }
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
 * Delete an experience?
 * @param {String} userId 
 * @param {String} name 
 * @returns 
 */
const delMisc = async function (userId, name) {
    try {
        const result = await currency.transaction(async t => {

            const rowCount = await miscinfo.destroy({
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
            title: "Deleted Bank.",
            desc: `${name} has been unregisted.`,
            content: result,
        }
    } catch (error) {
        // Some error has occured lol
        log("ERROR", "A server error has happened while trying to remove someone from the bank.")
        console.error(error)
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
const getMisc = async function (depth) {
    try {
        let banks;
        if (Number.isSafeInteger(depth)) {
            banks = await miscinfo.findAll({
                order: [
                    ['value', 'DESC'],
                ],
                limit: depth
            });
        } else {
            banks = await miscinfo.findAll({
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
        log("ERROR", "A server error has happened while trying to query blacklists..")
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
    addMisc,
    delMisc,
    getMisc,
}