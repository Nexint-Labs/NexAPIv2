const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { convNameToID } = require("#functions/dbs/currency/conv/balance");
const { authReq } = require("#functions/api/auth");
const router = express.Router()
const jsonParser = bodyParser.json()

// Version info
router.get('/', jsonParser, async (req, res) => {

    // Find all blacklists

    // Return the blacklist
    res.json({
        name: "Converters",
        desc: "Status of converters",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
        },
        refreshDate: Date.now(),
        error: false,
    })
})

router.query('/convNameToID', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { name } = request;
    if (!name) {
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
    const result = await convNameToID(name);

    // Return the notification list
    res.status(result.status).json(result)
    return;
})

router.mountPath = '/currency';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}