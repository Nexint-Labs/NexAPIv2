const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { authReq } = require("#functions/api/auth");
const { updateBalance } = require("#functions/dbs/currency/handleBalance");
const { currency } = require("#preload/db/currency");
const { getOptOut } = require("#functions/dbs/optOut/optOutUser");
const { updateBank, addBank } = require("#functions/dbs/currency/handleBank");
const { log } = require("#functions/core/log.mjs");
const { consumeBanknotes } = require("#functions/dbs/currency/consumables/consumeBanknotes");
const router = express.Router()
const jsonParser = bodyParser.json()

// Version info
router.get('/', jsonParser, async (req, res) => {

    // Status of balance
    res.json({
        name: "Update Bank",
        desc: "Status of bank lol",
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

    const result = await addBank(userId, name)
    res.status(result.status).json(result)
    return;
})

// Updates money
// yes
router.post('/deposit', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { userId, name, amount } = request;
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

    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Invalid Deposit",
            desc: "Deposit amount must be a positive number.",
            content: null
        });
    }

    try {
        const optOut = await getOptOut(userId);
        if (optOut.content === true) {
            res.status(410).json({
                error: true,
                status: 410,
                title: "Opted out.",
                desc: `${userId} is opted out.`,
                content: null,
            });
            return;
        } else if (optOut.content === null) {
            res.status(optOut.status).json({
                error: optOut.error,
                status: optOut.status,
                title: optOut.title,
                desc: optOut.desc,
                content: null,
            });
            return;
        }
        const result = await currency.transaction(async t => {
            const result = await updateBalance(userId, name, -amount, t)
            if (result.error) {
                throw result
            }
            const bankResult = await updateBank(userId, name, amount, t)
            if (bankResult.error) {
                throw bankResult
            }
            return {
                error: false,
                status: 200,
                title: "Deposit",
                desc: "Deposit has succeeded.",
                content: {
                    user: result.content,
                    bank: bankResult.content
                },
            }
        })
        res.status(result.status).json(result)

    } catch (error) {
        if (error.error) {
            return res.status(error.status).json(error);
        }

        log.error("Deposit failed:", error);

        return res.status(500).json({
            error: true,
            status: 500,
            title: "Server Error",
            desc: "Deposit cannot safely continue.",
            content: null,
        });
    }
    return;
})

// Updates money
// yes
router.post('/withdraw', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { userId, name, amount } = request;
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

    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Invalid Withdraw",
            desc: "Withdraw amount must be a positive number.",
            content: null
        });
    }

    try {
        const optOut = await getOptOut(userId);
        if (optOut.content === true) {
            res.status(410).json({
                error: true,
                status: 410,
                title: "Opted out.",
                desc: `${userId} is opted out.`,
                content: null,
            });
            return;
        } else if (optOut.content === null) {
            res.status(optOut.status).json({
                error: optOut.error,
                status: optOut.status,
                title: optOut.title,
                desc: optOut.desc,
                content: null,
            });
            return;
        }
        const result = await currency.transaction(async t => {
            const bankResult = await updateBank(userId, name, -amount, t)
            if (bankResult.error) {
                throw bankResult
            }
            const result = await updateBalance(userId, name, amount, t)
            if (result.error) {
                throw result
            }
            return {
                error: false,
                status: 200,
                title: "Withdraw",
                desc: "Withdraw has succeeded.",
                content: {
                    user: result.content,
                    bank: bankResult.content
                },
            }
        })
        res.status(result.status).json(result)

    } catch (error) {
        if (error.error) {
            return res.status(error.status).json(error);
        }

        log.error("Withdraw failed:", error);

        return res.status(500).json({
            error: true,
            status: 500,
            title: "Server Error",
            desc: "Withdraw cannot safely continue.",
            content: null,
        });
    }
    return;
})

// Consume banknotes
router.post('/consume', jsonParser, async (req, res) => {
    if (!authReq(req, res)) return;

    const { userId, qty } = req.body;
    if (!userId || qty === undefined) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request",
            desc: "Missing userId or qty.",
            content: null
        });
    }

    const result = await consumeBanknotes(userId, qty);
    return res.status(result.status).json(result);
});

router.mountPath = '/currency/update/bank';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}