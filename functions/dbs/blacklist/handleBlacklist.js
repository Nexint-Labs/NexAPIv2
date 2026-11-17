const { analytics, blacklist } = require("#preload/db/analytics");

/**
 * Add a member to the Nexint Blacklist.
 * @param {String} userId 
 * @param {String} name 
 * @returns 
 */
const addBlacklist = async function (userId, name) {
    try {

        // Try to create the user
        const result = await analytics.transaction(async t => {

            // idk why im using find or create :sob:
            let [user, created] = await blacklist.findOrCreate({
                where: {
                    userid: userId,
                },
                default: {
                    user: name,
                    timeStamp: Math.round(Date.now() / 1000),
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

            // Update the username lol
            await user.update(
                {
                    user: name
                },
                {
                    where: {
                        userid: userId,
                    },
                },
                { transaction: t }
            );

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
            title: "Created Blacklist.",
            desc: `${name} is now blacklisted.`
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
 * Deletes a user from the blacklist.
 * @param {String} userId 
 * @param {String} name 
 * @returns 
 */
const delBlacklist = async function (userId, name) {
    try {
        const result = await analytics.transaction(async t => {

            const rowCount = await blacklist.destroy({
                where: {
                    userid: userId,
                },
            })
            if (!rowCount) {
                return {
                    error: true,
                    status: 409,
                    title: "Conflict",
                    desc: `${name} is not blacklisted.`,
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
    addBlacklist,
    delBlacklist
}