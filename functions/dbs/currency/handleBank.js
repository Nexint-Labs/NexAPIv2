const { bank, currency } = require("#preload/db/currency");
const { Transaction } = require("sequelize");
const { log } = require("#functions/core/log");
const { getOptOut } = require("../optOut/optOutUser");

/**
 * Query or add a bank account.
 * Misleading name? yes, but I do not care lol
 * @param {String} userId 
 * @param {String} name 
 * @returns 
 */
const addBank = async function (userId, name) {
    
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
    try {

        // Try to create the user
        const result = await currency.transaction(async t => {

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

            if (created) {
                return {
                    error: true,
                    status: 409,
                    title: "Already created.",
                    desc: `${name} is already registered.`,
                    content: user,
                };
            }

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
            title: "Created Bank.",
            desc: `${name} is now registered.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log("ERROR", "A server error has happened while trying to add people to the bank.")
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
 * Update Balance, now with transactions!
 * This function is meant to be used with transactions. Do not use it standalone.
 * @param {String} userId 
 * @param {String} name 
 * @param {Number} value 
 * @param {Number} multiplier 
 * @param {Transaction} transaction 
 */
const updateBank = async function (userId, name, value, maxValue, transaction) {
    const result = await addBank(userId, name)
    if(result.error){
        throw new Error(result.desc)
    }
    const user = result.content

    let newValue = user.value, newMaxValue = user.maxValue;
    if(Number.isFinite(value)){
        newValue = value
    }
    if(Number.isFinite(bank)){
        newMaxValue = maxValue
    }

    // Update Name
    await user.update(
        {
            name: name,
            value: newValue,
            maxValue: newMaxValue,
        },
        {
            where: {
                userId: userId,
            },
        }, { transaction }
    );
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
    addBank,
    delBank,
    getBank,
    updateBank
}