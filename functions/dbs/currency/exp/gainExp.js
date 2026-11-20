const { expMaxGain } = require("#config/eco/currency");
const { log } = require("#functions/core/log");
const { miscinfo, currency } = require("#preload/db/currency");
const { addMisc } = require("../handleMisc");

const expGain = async function (userId, name) {
    try {
        const xpGained = Math.floor(Math.random() * expMaxGain) + 1;

        const result = await currency.transaction(async t => {
            const misc = await addMisc(userId, name, t);

            const user = misc.content

            user.exp += xpGained;

            let newLevel = 0;
            if (user.exp >= user.nextLevel) {
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
                    where: {
                        userId: userId,
                    }, transaction: t 
                },
            );
            return {
                user,
                newLevel
            }
        })

        return {
            error: false,
            status: 200,
            title: "Gained exp.",
            desc: `${name} gained some exp!`,
            content: result,
        };
    } catch (error) {


        log("ERROR", "A server error has happened while trying to gain exp.")
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

module.exports = {
    expGain
}