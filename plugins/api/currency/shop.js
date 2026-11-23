const express = require("express");
const { app } = require("#apps/web");
const { authReq } = require("#functions/api/auth");
const { buyItem } = require("#functions/dbs/currency/items/buyItems");

const { items } = require("#config/eco/currency");

const router = express.Router();

router.get("/", (req, res) => {

    return res.status(200).json({
        error: false,
        status: 200,
        title: "Item Catalog",
        desc: "Available item definitions.",
        content: items
    });
});

router.post("/buy", express.json(), async (req, res) => {

    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    const { userId, id, name, qty } = request;

    if (!userId || id == null || qty == null || !name) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request",
            desc: "Missing purchase information.",
            content: null
        });
    }

    const result = await buyItem(userId, name, id, qty);
    return res.status(result.status).json(result);
});

router.mountPath = "/currency/shop";

module.exports = {
    async execute() {
        app.use("/api/v1" + router.mountPath, router);
    }
};