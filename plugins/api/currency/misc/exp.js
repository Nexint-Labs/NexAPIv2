const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { addMisc, delMisc } = require("#functions/dbs/currency/handleMisc");
const { expGain } = require("#functions/dbs/currency/exp/gainExp");
const { authReq } = require("#functions/api/auth");
const router = express.Router()
const jsonParser = bodyParser.json()

// what
router.get('/', jsonParser, async (req, res) => {

    // Find all blacklists

    // Return the blacklist
    res.json({
        name: "Experience",
        desc: "Status of all experience users.",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
        },
        refreshDate: Date.now(),
        error: false,
    })
})

// Query misc info lol
// Wack behavior, absolutely. I don't know what I'm doing :)
router.query('/', jsonParser, async (req, res) => {

    // Get the request
    let request = req.body;

    // Get depth if exists...
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

    const result = await addMisc(userId, name)
    res.status(result.status).json(result)
})

// Gains experience.
// I don't know why post apparently gains EXP, but I guess we get it :)
// I should have seperated EXP from jobs lol
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

    const result = await expGain(userId, name)
    res.status(result.status).json(result)
    return;
})

// Delete an experience user.
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
    const result = await delMisc(userId, name)
    res.status(result.status).json(result)
    return;
})

router.mountPath = '/currency/misc/exp';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}