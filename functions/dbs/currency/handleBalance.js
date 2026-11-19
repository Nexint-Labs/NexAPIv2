const { balance, currency } = require("#preload/db/currency");
const { Transaction } = require("sequelize");
const { log } = require("#functions/core/log");

/**
 * Query or add a balance.
 * Misleading name? yes, but I do not care lol
 * @param {String} userId 
 * @param {String} name 
 * @returns 
 */
const addBalance = async function (userId, name) {
    try {

        // Try to create the user
        const result = await currency.transaction(async t => {

            // idk why im using find or create :sob:
            let [user, created] = await balance.findOrCreate({
                where: {
                    userid: userId,
                },
                default: {
                    user: name,
                    value: 0,
                    multiplier: 1,
                },
                transaction: t
            })

            if (created) {
                return {
                    error: true,
                    status: 409,
                    title: "Already Created.",
                    desc: `${name} is already registered.`,
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
            title: "Created Balance.",
            desc: `${name} is now registered.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log("ERROR", "A server error has happened while trying to add people to the blacklist.")
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
                    userid: userId,
                },
            }, { transaction: t })
            if (!rowCount) {
                return {
                    error: true,
                    status: 410,
                    title: "Gone",
                    desc: `${name} is not registered.`,
                    content: {
                        userid: userId,
                        user: name
                    },
                }
            }

            return {
                userId: userId,
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
            title: "Deleted Balance.",
            desc: `${name} has been unregisted.`,
            content: result,
        }
    } catch (error) {
        // Some error has occured lol
        log("ERROR", "A server error has happened while trying to remove someone from a blacklist.")
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
 * Update Balance, now with transactions!
 * This function is meant to be used with transactions. Do not use it standalone.
 * @param {String} userId 
 * @param {String} name 
 * @param {Number} value 
 * @param {Number} multiplier 
 * @param {Transaction} transaction 
 */
const updateBalance = async function (userId, name, value, multiplier, transaction) {
    const result = await addBalance(userId, name)
    if(result.error){
        throw new Error(result.desc)
    }
    const user = result.content

    let newValue = user.value, newMulti = user.multiplier;
    if(Number.isFinite(value)){
        newValue = value
    }
    if(Number.isFinite(multiplier)){
        newMulti = multiplier
    }

    // Update Name
    await user.update(
        {
            user: name,
            value: newValue,
            multiplier: newMulti,
        },
        {
            where: {
                userid: userId,
            },
        }, { transaction }
    );
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
    addBalance,
    delBalance,
    getBalance,
    updateBalance
}