const express = require("express");
const bodyParser = require('body-parser');
const { token } = require("#config/core/api");
const { app } = require("#apps/web");
const { convNameToID } = require("#functions/dbs/currency/conv/balance");
const router = express.Router()
const jsonParser = bodyParser.json()

router.query('/convNameToID', jsonParser, async (req, res) => {

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
    const { name } = request;
    if (!name) {
        res.status(400).json({
            error: "Malformed Request",
            desc: "Your request does not contain the required information. (name)",
            content: null,
        })
        return;
    }

    // Find all notifications for this user
    const result = await convNameToID(name);

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

router.mountPath = '/currency';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}