const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { getNotif, delNotif, addNotif } = require("#functions/dbs/notif/notifUser");
const { authReq } = require("#functions/api/auth");
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

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { userId, refresh, viewAll } = request;
    if (!userId || refresh === undefined) {
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
    const result = await getNotif(userId, refresh, viewAll);

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
    const { userId, refresh } = request;
    if (!userId || refresh === undefined) {
        res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request,",
            desc: "Your request does not contain the required information.",
            content: null,
        })
        return;
    }

    const result = await addNotif(userId, refresh)
    res.status(result.status).json(result)
    return;
})

router.delete('/', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

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
    const result = await delNotif(userId)
    res.status(result.status).json(result)
    return;
})

router.mountPath = '/notifs';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}