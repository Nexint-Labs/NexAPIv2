const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { gainAction } = require("#functions/dbs/action/gainAction");
const { authReq } = require("#functions/api/auth");
const router = express.Router()
const jsonParser = bodyParser.json()

// Version info
router.get('/', jsonParser, async (req, res) => {

    // Find all blacklists

    // Return the blacklist
    res.json({
        name: "Actions",
        desc: "Status of actions",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
        },
        refreshDate: Date.now(),
        error: false,
    })
})

router.post('/updateAction', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if text even exists
    const { userId, actionId, type } = request;
    if (!userId || !actionId || !type) {
        res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request,",
            desc: "Your request does not contain the required information.",
            content: null,
        })
        return;
    }

    // Remove the advertisement

    const result = await gainAction(userId, actionId, type);
    res.status(result.status).json(result)
    return;
});

router.mountPath = '/actions';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}