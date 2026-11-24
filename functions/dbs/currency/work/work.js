const { softEcoCap } = require("#config/eco/caps");
const { jobs } = require("#config/eco/currency");
const { log } = require("#functions/core/log.mjs");
const { currency } = require("#preload/db/currency");
const { addBalance, updateBalance } = require("../handleBalance");
const { queryJob, delJob } = require("../handleJobs");
const { getMulti } = require("../handleMulti");

/**
 * Work for money!
 * @param {String} userId 
 * @param {String} name 
 * @returns 
 */
const work = async function (userId, name) {
    try {

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
            const findJob = await queryJob(userId, t);

            if (findJob.error) {
                return {
                    error: true,
                    status: findJob.status,
                    title: findJob.title,
                    desc: findJob.desc,
                    content: findJob.content,
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

            const job = findJob.content

            if (Number(job.lastWorked) + jobs[job.jobId].maxDays * 86400 < Math.floor(Date.now() / 1000)) {
                const deleted = await delJob(userId, name, t)

                if (deleted.error) return deleted;

                return {
                    error: true,
                    status: 410,
                    title: "Job Expired",
                    desc: `${name} lost their job due to inactivity.`,
                    content: null
                };
            }

            const addedCoins = Math.round(job.wage * (0.8 + (Math.random() * 0.4)))

            const user = bal.content

            const addedBalance = Math.round(addedCoins * user.multiplier * multi.content)

            const updatedBal = await updateBalance(userId, name, addedBalance, t, true)

            if (updatedBal.error) {
                return {
                    error: true,
                    status: updatedBal.status,
                    title: updatedBal.title,
                    desc: updatedBal.desc,
                    content: updatedBal.content,
                };
            }

            await job.increment('workCount', {
                by: 1,
                transaction: t
            });

            await job.update({
                lastWorked: Math.floor(Date.now() / 1000)
            }, {
                transaction: t
            });
            await job.reload({
                transaction: t
            })

            let newWage = 0;
            let raise = 0

            if (job.workCount % jobs[job.jobId].promo == 0) {
                const oldWage = Number(job.wage);

                newWage = Math.ceil(oldWage + jobs[job.jobId].promoAmount) * ((Math.random() * 0.4) + 0.8);

                if (newWage >= softEcoCap) {
                    newWage = Math.ceil(oldWage + jobs[job.jobId].promoAmount) * ((Math.random() * 0.01) + 0.005);
                }

                raise = newWage - oldWage;
                await job.update({
                    wage: newWage
                }, {
                    transaction: t
                })
            }
            return {
                error: false,
                user: updatedBal.content,
                job,
                multi: multi.content,
                addedBalance,
                newWage,
                raise
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
            title: "Worked for money.",
            desc: `${name} worked for some money!`,
            content: result,
        };
    } catch (error) {


        log.error("A server error has happened while trying to work for cash.", error)
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
    work
}