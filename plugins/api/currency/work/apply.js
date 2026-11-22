const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { delJob, addJob, queryJobList } = require("#functions/dbs/currency/handleJobs");
const { jobs } = require("#config/eco/currency");
const { authReq } = require("#functions/api/auth");
const router = express.Router()
const jsonParser = bodyParser.json()

// Version info
router.get('/', jsonParser, async (req, res) => {

    // Find all blacklists

    // Return the blacklist
    res.json({
        name: "Jobs",
        desc: "Status of all jobs.",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
        },
        refreshDate: Date.now(),
        error: false,
    })
})

// Query jobs
// Wack behavior, absolutely. I don't know what I'm doing :)
router.query('/', jsonParser, async (req, res) => {

    // Get the request (this technically isnt necessary but)
    let request = req.body;

    const result = await queryJobList()
    res.status(result.status).json(result)
    return;
})

// Adds you to a job (forcefully)
router.post('/', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { userId, name, jobId } = request;
    if (!userId || !name || !jobs[jobId]) {
        res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request,",
            desc: "Your request does not contain the required information.",
            content: null,
        })
        return;
    }

    const result = await addJob(userId, name, jobId)
    res.status(result.status).json(result)
    return;
})

// Delete a job
// why does this method exist?
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
    const result = await delJob(userId, name)
    res.status(result.status).json(result)
    return;
})

router.mountPath = '/currency/work/apply';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}