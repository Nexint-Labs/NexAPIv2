const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { queryJob } = require("#functions/dbs/currency/handleJobs");
const { authReq } = require("#functions/api/auth");
const { work } = require("#functions/dbs/currency/work/work");
const router = express.Router()
const jsonParser = bodyParser.json()

// Version info
router.get('/', jsonParser, async (req, res) => {

    // Find all blacklists

    // Return the blacklist
    res.json({
        name: "Work",
        desc: "Status of working lol",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
        },
        refreshDate: Date.now(),
        error: false,
    })
})

// Query a users work history lol
router.query('/', jsonParser, async (req, res) => {

    // Get the request
    let request = req.body;

    const { userId } = request;
    if (!userId) {
        res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request,",
            desc: "Your request does not contain the required information.",
            content: null,
        })
        return;
    }

    const result = await queryJob(userId)
    res.status(result.status).json(result)
})

// Work for money...
// yes
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

    const result = await work(userId, name)
    res.status(result.status).json(result)
    return;
})

router.mountPath = '/currency/work/job';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}