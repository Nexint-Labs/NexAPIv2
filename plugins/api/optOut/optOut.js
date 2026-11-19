const express = require("express");
const bodyParser = require('body-parser');
const { token } = require("#config/core/api");
const { app } = require("#apps/web");
const { getOptOut, addOptOut, delOptOut } = require("#functions/dbs/optOut/optOutUser");
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
    const { firstId, secondId } = request;
    if (!firstId) {
        res.status(400).json({
            error: "Malformed Request",
            desc: "Your request does not contain the required information. (userID)",
            content: null,
        })
        return;
    }

    // Find all notifications for this user
    const result = await getOptOut(firstId, secondId);

    // Return the notification list
    if (result.error) {
        res.status(result.status).json({
            error: result.title,
            desc: result.desc,
            content: result.content,
        })
        return;
    }
    res.status(result.status).json({
        error: false,
        desc: result.desc,
        content: result.content,
    })
})

router.post('/', jsonParser, async (req, res) => {

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
    const { userId, name } = request;
    if (!userId || !name) {
        res.status(400).json({
            error: "Malformed Request",
            desc: "Your request does not contain the required information. (userId, name)",
            content: null,
        })
        return;
    }

    const result = await addOptOut(userId, name)
    if (result.error) {
        res.status(result.status).json({
            error: result.title,
            desc: result.desc,
            content: result.content,
        })
        return;
    }
    res.status(result.status).json({
        error: false,
        desc: result.desc,
        content: result.content,
    })
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
            error: "Malformed Request",
            desc: "Your request does not contain the required information. (userId)",
            content: null,
        })
        return;
    }

    // Remove the user
    const result = await delOptOut(userId)
    if (result.error) {
        res.status(result.status).json({
            error: result.title,
            desc: result.desc,
            content: result.content,
        })
        return;
    }
    res.status(result.status).json({
        error: false,
        desc: result.desc,
        content: result.content,
    })
})

router.mountPath = '/opt-out';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}