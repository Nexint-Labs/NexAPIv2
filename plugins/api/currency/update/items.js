const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { authReq } = require("#functions/api/auth");
const { getLootBox } = require("#functions/dbs/currency/lootbox/lootBoxOdds");
const { delItem, getItems, updateItem, queryItem } = require("#functions/dbs/currency/handleItems");
const { updateLootBox } = require("#functions/dbs/currency/lootbox/openLootBox");
const router = express.Router()
const jsonParser = bodyParser.json()

// what
router.get('/', jsonParser, async (req, res) => {

    // Find all blacklists

    // Return the blacklist
    res.json({
        name: "Items",
        desc: "Status of all item users.",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
        },
        refreshDate: Date.now(),
        error: false,
    })
})

// Lootbox odds
router.query('/lootbox', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // Get depth if exists...
    const { id, name } = request;
    const itemName = id ?? name;

    if (itemName == null) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request",
            desc: "Your request does not contain the required information.",
            content: null
        });
    }

    const result = await getLootBox(itemName);
    res.status(result.status).json(result)
})

// Get all items owned by a user
router.query("/", jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // Get depth if exists...
    const { userId } = request;

    if (!userId) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request",
            desc: "Your request does not contain the required information.",
            content: null
        });
    }

    const result = await getItems(userId);
    return res.status(result.status).json(result);
});

// Query a specific inventory item
router.query("/item", jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // Get depth if exists...
    const { id, name, userId } = request;
    const itemName = id ?? name;

    if (!userId || itemName == null) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request",
            desc: "Your request does not contain the required information.",
            content: null
        });
    }

    const result = await queryItem(userId, String(itemName));
    return res.status(result.status).json(result);
});

// Update item quantity
router.post("/", jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { userId, name, id, amount, forced, required } = request;
    const itemName = id ?? name;

    if (!userId || itemName == null || amount == null) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request",
            desc: "Your request does not contain the required information.",
            content: null
        });
    }

    const result = await updateItem(userId, String(itemName), amount, undefined, forced, required);

    return res.status(result.status).json(result);
});


// Opens loot boxes
// I don't know why post apparently gains EXP, but I guess we get it :)
// I should have seperated EXP from jobs lol
router.post('/lootbox', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // Get depth if exists...
    const { id, name, userId, qty } = request;
    const itemName = id ?? name;

    if (!userId || itemName == null || qty === undefined) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request",
            desc: "Your request does not contain the required information.",
            content: null
        });
    }

    const result = await updateLootBox(userId, itemName, qty)
    res.status(result.status).json(result)
    return;
})

// Delete an item.
// why does this method exist?
router.delete('/', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { userId, name, id } = request;
    const itemId = id ?? name;
    if (!userId || itemId == null) {
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
    const result = await delItem(userId, String(itemId));
    res.status(result.status).json(result)
    return;
})

router.mountPath = '/currency/update/items';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}