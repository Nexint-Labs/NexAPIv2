const { Transaction } = require("sequelize");
const { log } = require("#functions/core/log.mjs");
const { action, fundb } = require("#preload/db/funDBs");
const { addAction } = require("./handleAction");


/**
 * Gain an action.
 * @param {String} userId 
 * @param {String} actionId 
 * @param {String} type 
 * @param {Transaction} t
 * @returns 
 */
const gainAction = async function (userId, actionId, type) {
    try {

        const result = await fundb.transaction(async t => {
            const misc = await addAction(userId, actionId, type, t);

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

            await user.increment('value', {
                by: 1,
                transaction: t
            });
            await user.reload({
                transaction: t
            });
            return user
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
            title: "Gained action.",
            desc: `${userId} and ${actionId} gained an action in ${type}!`,
            content: result,
        };
    } catch (error) {


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
    gainAction
}