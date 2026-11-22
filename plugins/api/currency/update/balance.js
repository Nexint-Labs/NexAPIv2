const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { authReq } = require("#functions/api/auth");
const { updateBalance, addBalance } = require("#functions/dbs/currency/handleBalance");
const router = express.Router()
const jsonParser = bodyParser.json()

// Version info
router.get('/', jsonParser, async (req, res) => {

    // Status of balance
    res.json({
        name: "Update Balance",
        desc: "Status of balance lol",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
        },
        refreshDate: Date.now(),
        error: false,
    })
})

// Updates money
// yes
router.query('/', jsonParser, async (req, res) => {

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

    const result = await addBalance(userId, name)
    res.status(result.status).json(result)
    return;
})

// Updates money
// yes
router.post('/', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { userId, name, amount, required } = request;
    if (!userId || !name || typeof amount !== "number") {
        res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request,",
            desc: "Your request does not contain the required information.",
            content: null,
        })
        return;
    }

    const result = await updateBalance(userId, name, amount, false, false, required)
    res.status(result.status).json(result)
    return;
})

router.mountPath = '/currency/update/balance';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}