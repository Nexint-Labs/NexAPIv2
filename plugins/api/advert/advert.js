const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { getAdvert, addAdvert, delAdvert } = require("#functions/dbs/advert/handleAdvert");
const router = express.Router()
const jsonParser = bodyParser.json()

router.get('/', jsonParser, async (req, res) => {

    // Find all advertisements
    const listAdvert = await getAdvert();

    // Return the advertisement
    res.json({
        name: "Advertising",
        desc: "Info of the advertising list lol",
        content: listAdvert,
        refreshDate: Date.now(),
        error: false,
    })
})

router.post('/', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if text even exists
    const { text } = request;
    if (text) {
        res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request,",
            desc: "Your request does not contain the required information.",
            content: null,
        })
        return;
    }

    const result = await addAdvert(text)
    res.status(result.status).json(result)
    return;
})

router.delete('/', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if text even exists
    const { text } = request;
    if (!text) {
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
    const result = await delAdvert(text)
    res.status(result.status).json(result)
    return;
})

router.mountPath = '/advert';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}