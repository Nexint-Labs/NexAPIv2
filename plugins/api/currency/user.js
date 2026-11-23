/*
Users
This function deals with users.
*/

const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { getBalance, addBalance, delBalance } = require("#functions/dbs/currency/handleBalance");
const { getBank, addBank } = require("#functions/dbs/currency/handleBank");
const { getJob, queryJob, queryJobList } = require("#functions/dbs/currency/handleJobs");
const { authReq } = require("#functions/api/auth");
const { getMulti } = require("#functions/dbs/currency/handleMulti");
const { addMisc } = require("#functions/dbs/currency/handleMisc");
const { getItems } = require("#functions/dbs/currency/handleItems");
const { queryJobInfo } = require("#functions/dbs/currency/conv/job");
const { queryItemNameId } = require("#functions/dbs/currency/core/queryItems");
const router = express.Router()
const jsonParser = bodyParser.json()

// Query all balances
router.get('/', jsonParser, async (req, res) => {

    // Find all blacklists
    const balance = await getBalance();
    const bank = await getBank();
    const jobs = await getJob();

    // Return the blacklist
    res.json({
        name: "User Accounts",
        desc: "All registered accounts!",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
            balance: balance.content,
            bank: bank.content,
            jobs: jobs.content
        },
        refreshDate: Date.now(),
        error: false,
    })
})

// Query the leaderboards.
// Wack behavior, absolutely. I don't know what I'm doing :)
router.query('/', jsonParser, async (req, res) => {

    // Get the request
    let request = req.body;

    // Get depth if exists...
    const { depth } = request;

    // Find all accounts for a specific depth
    const balance = await getBalance(depth);
    const bank = await getBank(depth);
    const jobs = await getJob(depth);

    // Return the notification list
    if (balance.error) {
        res.status(balance.status).json(balance)
        return;
    }
    if (bank.error) {
        res.status(bank.status).json(bank)
        return;
    }

    res.status(200).json({
        error: false,
        desc: "Currency Leaderboards:",
        content: {
            balance: balance.content,
            bank: bank.content,
            jobs: jobs.content
        },
    })
})

// Make a new balance user, or queries the existing user.
// Weird behavior, I know.
// But we don't talk about it :)
router.post('/', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { userId, name } = request;
    if (!userId || !name) {
        res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request,",
            desc: "Your request does not contain the required information.",
            content: null,
        })
        return;
    }

    const balance = await addBalance(userId, name);
    const bank = await addBank(userId, name);
    const job = await queryJob(userId);
    const multi = await getMulti(userId);
    const misc = await addMisc(userId, name);
    const inv = await getItems(userId);

    if (balance.error) {
        res.status(balance.status).json(balance)
        return;
    }
    if (bank.error) {
        res.status(bank.status).json(bank)
        return;
    }
    if (job.error && job.status !== 404) {
        res.status(job.status).json(job)
        return;
    }
    if (multi.error) {
        res.status(multi.status).json(multi)
        return;
    }
    if (misc.error) {
        res.status(misc.status).json(misc)
        return;
    }
    if (inv.error) {
        res.status(inv.status).json(inv)
        return;
    }
    let jobInfo = {
        content: null
    };
    if (!job.error) {
        jobInfo = await queryJobInfo(job.content.jobId);
    }


    let itemNetWorth = 0;

    for (const record of inv.content) {
        const item = await queryItemNameId(record.name);

        if (item !== undefined) {
            itemNetWorth += item.value * record.value;
        }
    }
    res.status(200).json({
        error: false,
        desc: "User Info (Balance)",
        content: {
            balance: balance.content,
            bank: bank.content,
            job: job.content,
            multi: multi.content,
            misc: misc.content,
            inv: inv.content,
            jobInfo: jobInfo.content,
            itemNetWorth: itemNetWorth
        },
    })
    return;
})

router.delete('/', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { userId, name } = request;
    if (!userId || !name) {
        res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request,",
            desc: "Your request does not contain the required information.",
            content: null,
        })
        return;
    }

    // Remove the user
    const result = await delBalance(userId, name)
    res.status(result.status).json(result)
})

router.mountPath = '/currency';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}