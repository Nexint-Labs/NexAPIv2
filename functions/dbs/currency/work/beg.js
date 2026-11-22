const { log } = require("#functions/core/log.mjs");
const { currency } = require("#preload/db/currency");
const { addBalance } = require("../handleBalance");
const { getMulti } = require("../handleMulti");


/**
 * Beg for money!
 * @param {String} userId 
 * @param {String} name 
 * @returns 
 */
const beg = async function (userId, name) {
    try {
        let rng = Math.random();
        let addedCoins = 500 + Math.round(Math.random() * 1000)
        if (rng < 0.1) {
            addedCoins = 0
        } else if (rng > 0.99) {
            addedCoins = 5000000 + Math.round(Math.random() * 10000000);
        }

        const result = await currency.transaction(async t => {
            const bal = await addBalance(userId, name, t);

            if (bal.error) {
                return {
                    error: true,
                    status: bal.status,
                    title: bal.title,
                    desc: bal.desc,
                    content: bal.content,
                };
            }
            
            const multi = await getMulti(userId, t);

            if (multi.error) {
                return {
                    error: true,
                    status: multi.status,
                    title: multi.title,
                    desc: multi.desc,
                    content: multi.content,
                };
            }

            const user = bal.content

            const addedBalance = Math.round(addedCoins * user.multiplier * multi.content)

            await user.increment('value', {
                by: addedBalance,
                transaction: t
            });
            await user.reload({
                transaction: t,
            });
            return {
                error: false,
                user,
                addedBalance,
                multi,
                massiveTip: rng > 0.99
            }
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
            title: "Begged for money.",
            desc: `${name} begged for some money!`,
            content: result,
        };
    } catch (error) {


        log.error("A server error has happened while trying to beg for cash.", error)
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
    beg
}