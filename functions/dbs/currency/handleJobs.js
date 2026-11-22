const { work, currency } = require("#preload/db/currency");
const { Transaction } = require("sequelize");
const { log } = require("#functions/core/log.mjs");
const { getOptOut } = require("../optOut/optOutUser");
const { jobs, choiceCount } = require("#config/eco/currency");

/**
 * Force add a job.
 * FINALLY, only an add operation!
 * @param {String} userId 
 * @param {String} name 
 * @param {String} jobId 
 * @param {Transaction} t
 * @returns 
 */
const addJob = async function (userId, name, jobId, t) {
    const optOut = await getOptOut(userId);
    if (optOut.content === true) {
        return {
            error: true,
            status: 410,
            title: "Opted out.",
            desc: `${userId} is opted out.`,
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

    const createJob = async function (userId, name, jobId, t) {

        // idk why im using find or create :sob:
        let [user, created] = await work.findOrCreate({
            where: {
                userId: userId,
            },
            defaults: {
                name: name,
                wage: Math.floor(jobs[jobId].wage * ((Math.random() * 0.4) + 0.8)),
                jobId: jobId,
                lastWorked: Math.floor(Date.now() / 1000),
                workCount: 0,
            },
            transaction: t
        })

        // yes
        if (!created) {
            await user.update(
                {
                    name: name,
                    wage: Math.floor(jobs[jobId].wage * ((Math.random() * 0.4) + 0.8)),
                    jobId: jobId,
                    lastWorked: Math.floor(Date.now() / 1000),
                    workCount: 0,
                },
                {
                    transaction: t
                }
            );
        }

        return [user, created]
    }

    // Transaction safety, outside try-catch because I want errors to propagate :)
    if (t) {
        let [user, created] = await createJob(userId, name, jobId, t)
        if (!created) {
            return {
                error: false,
                status: 200,
                title: "DB Updated.",
                desc: `${name} is already registered.`,
                content: user,
            };
        }
        return {
            error: false,
            status: 201,
            title: "Created Job.",
            desc: `${name} is now registered.`,
            content: user,
        }
    }

    try {

        // Try to create the user
        const [result, created] = await currency.transaction(async t => {

            let [user, created] = await createJob(userId, name, jobId, t)

            return [user, created];
        });

        if (!created) {
            return {
                error: false,
                status: 200,
                title: "DB Updated.",
                desc: `${name} is already registered.`,
                content: result,
            };
        }
        return {
            error: false,
            status: 201,
            title: "Created Job.",
            desc: `${name} is now registered.`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log.error("A server error has happened while trying to add someone to work.", error)
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
 * Query a job.
 * 404 if there is no job.
 * @param {String} userId 
 * @param {Transaction} t
 * @returns 
 */
const queryJob = async function (userId, t) {
    const optOut = await getOptOut(userId);
    if (optOut.content === true) {
        return {
            error: true,
            status: 410,
            title: "Opted out.",
            desc: `${userId} is opted out.`,
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

    const findJob = async function (userId, t) {

        // idk why im using find or create :sob:
        const user = await work.findOne({
            where: {
                userId: userId,
            },
            transaction: t
        })

        return user
    }

    // Transaction safety, outside try-catch because I want errors to propagate :)
    if (t) {
        const user = await findJob(userId, t)
        if (!user) {
            return {
                error: true,
                status: 404,
                title: "User does not exist.",
                desc: `${userId} does not have a job.`,
                content: user,
            };
        }
        return {
            error: false,
            status: 200,
            title: "Found Job.",
            desc: `${userId} HAS A JOB???? (how)`,
            content: user,
        }
    }

    try {

        // Try to create the user
        const result = await currency.transaction(async t => {

            let result = await findJob(userId, t)

            return result;
        });

        if (!result) {
            return {
                error: true,
                status: 404,
                title: "User does not exist.",
                desc: `${userId} does not have a job.`,
                content: result,
            };
        }
        return {
            error: false,
            status: 200,
            title: "Found Job.",
            desc: `${userId} HAS A JOB???? (how)`,
            content: result,
        }
    } catch (error) {

        // Some serious error has occured.
        log.error("A server error has happened while trying to find a job.", error)
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
 * Delete a job?
 * @param {String} userId 
 * @param {String} name 
 * @param {Transaction} t
 * @returns 
 */
const delJob = async function (userId, name, t) {

    const processDelete = async function (userId, t) {

        const rowCount = await work.destroy({
            where: {
                userId: userId,
            },
            transaction: t
        })
        return rowCount

    }

    if (t) {
        const deleted = await processDelete(userId, t)
        if (!deleted) {
            return {
                error: true,
                status: 404,
                title: "Not Found",
                desc: `${name} is not registered.`,
                content: null,
            }
        }

        return {
            error: false,
            status: 200,
            title: "Deleted Job.",
            desc: `${name} has been unregisted.`,
            content: null,
        }

    }
    try {
        const result = await currency.transaction(async t => {

            const rowCount = await processDelete(userId, t)
            if (!rowCount) {
                return {
                    error: true,
                    status: 404,
                    title: "Not Found",
                    desc: `${name} is not registered.`,
                    content: null,
                }
            }
            return null
        })

        if (result !== null) {

            // So JS doesnt get mad at me lol
            return {
                error: true,
                status: result.status,
                title: result.title,
                desc: result.desc,
                content: result,
            }
        }

        return {
            error: false,
            status: 200,
            title: "Deleted Job.",
            desc: `${name} has been unregisted.`,
            content: null
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to remove someone from working.", error)
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
 * Gets all job accounts
 * @param {Number} depth 
 * @returns 
 */
const getJob = async function (depth) {
    try {
        let jobs;
        if (Number.isSafeInteger(depth)) {
            jobs = await work.findAll({
                order: [
                    ['wage', 'DESC'],
                ],
                limit: depth
            });
        } else {
            jobs = await work.findAll({
                order: [
                    ['wage', 'DESC'],
                ]
            });
        }

        return {
            error: false,
            status: 200,
            title: "Job List",
            desc: `List of all job accounts:`,
            content: jobs
        }
    } catch (error) {
        // Some error has occured lol
        log.error("A server error has happened while trying to query jobs.", error)
        return {
            error: true,
            status: 500,
            title: "Server Error",
            desc: "The server in question has faced a serious server error.",
            content: null,
        }

    }
}

/**
 * Query the job listings
 * @returns 
 */

const queryJobList = async function () {
    let chance = 0;
    let chances = [];
    for (let i = 0; i < jobs.length; i++) {
        chance += jobs[i].chance
        chances.push(jobs[i].chance);
    }
    // Pull 3 random jobs.
    let choices = [];
    for (let i = 0; i < choiceCount; i++) {
        let rng = Math.floor(Math.random() * chance);
        let choice = 0;
        let tmp = 0;
        while (tmp <= rng) {
            tmp += jobs[choice].chance;
            choice += 1;
        }
        choices.push({
            jobId: choice - 1,
            wage: jobs[choice - 1].wage
        });
    }

    return {
        error: false,
        status: 200,
        title: "Job Listings",
        desc: "Available jobs.",
        content: {
            jobs: jobs,
            choiceCount: choiceCount,
            totalChance: chance,
            choices: choices
        }
    };
}

module.exports = {
    addJob,
    delJob,
    getJob,
    queryJob,
    queryJobList
}