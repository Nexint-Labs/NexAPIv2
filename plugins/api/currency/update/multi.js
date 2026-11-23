
const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { authReq } = require("#functions/api/auth");
const { getMultiDetails } = require("#functions/dbs/currency/handleMulti");
const { consumeMulti } = require("#functions/dbs/currency/consumables/consumeMulti");
const router = express.Router()
const jsonParser = bodyParser.json()

// Version info
router.get('/', jsonParser, async (req, res) => {

    // Status of multipliers
    res.json({
        name: "Multiplier Details",
        desc: "Status of multipliers",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
        },
        refreshDate: Date.now(),
        error: false,
    })
})

// Queries multipliers
router.query('/', jsonParser, async (req, res) => {

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

    const result = await getMultiDetails(userId);
    res.status(result.status).json(result)
    return;
})

// Consume multiplier items
router.post('/consume', jsonParser, async (req, res) => {
    if (!authReq(req, res)) return;

    const { userId, itemId, qty } = req.body;
    if (!userId || itemId == null || qty === undefined) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request",
            desc: "Missing userId, itemId or qty.",
            content: null
        });
    }

    const result = await consumeMulti(userId, itemId, qty);
    return res.status(result.status).json(result);
});

router.mountPath = '/currency/multipliers';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}
