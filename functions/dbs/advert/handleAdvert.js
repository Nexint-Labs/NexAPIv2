const { frameName } = require("#config/core/core");
const { analytics, advert } = require("#preload/db/analytics");

/**
 * Adds an advertisement.
 * @param {String} name 
 * @returns 
 */
const addAdvert = async function (name) {
    try {

        // Try to create the user
        const result = await analytics.transaction(async t => {

            // idk why im using find or create :sob:
            let [user, created] = await advert.findOrCreate({
                where: {
                    name: name
                },
                default: {
                    user: name,
                }
            },
                { transaction: t })

            if (created) {
                return {
                    error: true,
                    status: 409,
                    title: "Already blacklisted.",
                    desc: `${name} is already blacklisted.`,
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
                desc: result.desc
            }
        }
        return {
            error: false,
            status: 201,
            title: "Created Advertisement.",
            desc: `${name} is now being advertised across ${frameName}.`
        }
    } catch (error) {

        // Some serious error has occured.
        log("ERROR", "A server error has happened while trying to opt people out.")
        console.error(error)
        return {
            error: true,
            status: 500,
            title: "Server Error",
            desc: "The server in question has faced a serious server error."
        }
    }
}

/**
 * Deletes an advertisement.
 * @param {String} name 
 * @returns 
 */
const delAdvert = async function (name) {
    try {
        const result = await analytics.transaction(async t => {

            const rowCount = await advert.destroy({
                where: {
                    name: name
                },
            })
            if (!rowCount) {
                return {
                    error: true,
                    status: 410,
                    title: "Conflict",
                    desc: `${name} is already gone.`,
                }
            }
        })

        if (result.error) {
            
            // So JS doesnt get mad at me lol
            return {
                error: true,
                status: result.status,
                title: result.title,
                desc: result.desc
            }
        }
        
        return {
            error: false,
            status: 200,
            title: "Deleted Blacklist.",
            desc: `${name} has been removed from the blacklist.`
        }
    } catch (error) {
        // Some error has occured lol
        log("ERROR", "A server error has happened while trying to opt people out.")
        console.error(error)
        return {
            error: true,
            status: 500,
            title: "Server Error",
            desc: "The server in question has faced a serious server error."
        }
    }
}

module.exports = {
    addAdvert,
    delAdvert
}