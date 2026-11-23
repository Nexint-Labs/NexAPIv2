const { expMaxGain } = require("#config/eco/currency");
const { log } = require("#functions/core/log.mjs");
const { miscinfo, currency } = require("#preload/db/currency");
const { addBank } = require("../handleBank");
const { addMisc } = require("../handleMisc");


/**
 * Gain experience!
 * @param {String} userId 
 * @param {String} name 
 * @returns 
 */
const expGain = async function (userId, name) {
    try {
        const xpGained = Math.floor(Math.random() * expMaxGain) + 1;

        const result = await currency.transaction(async t => {
            const misc = await addMisc(userId, name, t);

            if (misc.error) {
                return {
                    error: true,
                    status: misc.status,
                    title: misc.title,
                    desc: misc.desc,
                    content: misc.content,
                };
            }

            const user = misc.content

            await user.increment('exp', {
                by: xpGained,
                transaction: t
            });
            await user.reload({
                transaction: t,
            });

            let newLevel = 0;
            if (user.exp >= user.nextLevel) {
                const result = await addBank(userId, name, t);
                if(result.error){
                    throw result
                }
                const bank = result.content;

                await bank.update(
                    {
                        maxValue: Math.floor(bank.maxValue * 1.2)
                    },
                    {
                        transaction: t
                    },
                );

                user.exp = 0;
                user.level += 1;
                user.nextLevel = Math.floor(
                    user.nextLevel * 1.09051
                ) + 1;

                newLevel = user.level;
            }

            await user.update(
                {
                    name: name,
                    exp: user.exp,
                    level: user.level,
                    nextLevel: user.nextLevel,
                },
                {
                    transaction: t
                },
            );
            return {
                error: false,
                user,
                newLevel
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
            title: "Gained exp.",
            desc: `${name} gained some exp!`,
            content: result,
        };
    } catch (error) {
        if (error.error) {
            return error
        }


        log.error("A server error has happened while trying to gain exp.", error)
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
    expGain
}