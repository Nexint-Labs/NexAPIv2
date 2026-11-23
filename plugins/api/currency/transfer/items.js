const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { authReq } = require("#functions/api/auth");
const { currency } = require("#preload/db/currency");
const { log } = require("#functions/core/log.mjs");
const { updateItem } = require("#functions/dbs/currency/handleItems");
const router = express.Router()
const jsonParser = bodyParser.json()

// Version info
router.get('/', jsonParser, async (req, res) => {

    // Status of balance
    res.json({
        name: "Transfer Items",
        desc: "Status of items lol",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
        },
        refreshDate: Date.now(),
        error: false,
    })
})
// Transfers items from one user to another.
// yes
router.post('/', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { userId, name, transferId, transferName, amount, itemId } = request;
    if (!userId || !name || !transferId || !transferName || typeof amount !== "number" || itemId == null) {
        res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request,",
            desc: "Your request does not contain the required information.",
            content: null,
        })
        return;
    }

    if (userId === transferId) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Invalid Transfer",
            desc: "You cannot transfer items to yourself.",
            content: null
        });
    }

    if (amount <= 0) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Invalid Transfer",
            desc: "You cannot transfer a non zero amount mmm.",
            content: null
        });
    }

    if (!Number.isSafeInteger(amount)) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Invalid Transfer",
            desc: "You cannot transfer an undefined number what are you doing broskio how did you even get this result-",
            content: null
        });
    }

    try {
        const result = await currency.transaction(async t => {
            const userResult = await updateItem(userId, itemId, -amount, t)
            if (userResult.error) {
                throw userResult
            }
            const transferResult = await updateItem(transferId, itemId, amount, t)
            if (transferResult.error) {
                throw transferResult
            }
            return {
                error: false,
                status: 200,
                title: "Transferred items.",
                desc: "Transferred items between users successfully.",
                content: {
                    userResult: userResult.content,
                    transferResult: transferResult.content
                },
            }
        })
        res.status(result.status).json(result)

    } catch (error) {
        if (error?.error === true) {
            return res.status(error.status).json(error);
        }

        log.error("An unhandled error related to transactions has occured.", error);

        return res.status(500).json({
            error: true,
            status: 500,
            title: "Transfer Failed",
            desc: "An unexpected error occurred while transferring items.",
            content: null
        });
    }
    return;
})

router.mountPath = '/currency/transfer/items';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}