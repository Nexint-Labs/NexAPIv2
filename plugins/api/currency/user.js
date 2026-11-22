/*
Users
This function deals with users.
*/

const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { getBalance, addBalance, delBalance } = require("#functions/dbs/currency/handleBalance");
const { getBank, addBank } = require("#functions/dbs/currency/handleBank");
const { getJob } = require("#functions/dbs/currency/handleJobs");
const { authReq } = require("#functions/api/auth");
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
        desc: "User Info (Balance)",
        content: {
            balance: balance.content,
            bank: bank.content,

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