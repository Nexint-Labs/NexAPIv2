const express = require("express");
const bodyParser = require('body-parser');
const { token } = require("#config/core/api");
const { app } = require("#apps/web");
const { getOptOut, addOptOut, delOptOut } = require("#functions/dbs/optOut/optOutUser");
const { authReq } = require("#functions/api/auth");
const router = express.Router()
const jsonParser = bodyParser.json()

router.get('/', jsonParser, async (req, res) => {
    res.json({
        name: "Opt Out",
        desc: "Version info of opt out?",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
        },
        refreshDate: Date.now(),
        error: true,
    })
})

router.query('/', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { firstId, secondId } = request;
    if (!firstId) {
        res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request,",
            desc: "Your request does not contain the required information.",
            content: null,
        })
        return;
    }

    // Find all notifications for this user
    const result = await getOptOut(firstId, secondId);

    // Return the notification list
    res.status(result.status).json(result)
    return;
})

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

    const result = await addOptOut(userId, name)
    res.status(result.status).json(result)
    return;
})

router.delete('/', jsonParser, async (req, res) => {

    // Get the request
    let request = req.body;

    // Authenticate?
    if (request.token != token) {
        res.status(403).json({
            error: "Insufficient Permissions",
            desc: "You are not authenticated",
            content: null,
        });
        return;
    }

    // See if the user ID even exists
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

    // Remove the user
    const result = await delOptOut(userId)
    res.status(result.status).json(result)
    return;
})

router.mountPath = '/opt-out';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}