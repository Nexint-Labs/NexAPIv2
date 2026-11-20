const express = require("express");
const bodyParser = require('body-parser');
const { token } = require("#config/core/api");
const { app } = require("#apps/web");
const { getNotif, delNotif, addNotif } = require("#functions/dbs/notif/notifUser");
const router = express.Router()
const jsonParser = bodyParser.json()

router.get('/', jsonParser, async (req, res) => {
    res.json({
        name: "Notification",
        desc: "Version info of the notification",
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
    const { userId, refresh, viewAll } = request;
    if (!userId || refresh === undefined) {
        res.status(400).json({
            error: "Malformed Request",
            desc: "Your request does not contain the required information. (userID, refresh)",
            content: null,
        })
        return;
    }

    // Find all notifications for this user
    const result = await getNotif(userId, refresh, viewAll);

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
    const { userId, refresh } = request;
    if (!userId || refresh === undefined) {
        res.status(400).json({
            error: "Malformed Request",
            desc: "Your request does not contain the required information. (userID, refresh)",
            content: null,
        })
        return;
    }

    const result = await addNotif(userId, refresh)
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
            desc: "Your request does not contain the required information. (userID, refresh)",
            content: null,
        })
        return;
    }

    // Remove the user
    const result = await delNotif(userId)
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

router.mountPath = '/notifs';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}