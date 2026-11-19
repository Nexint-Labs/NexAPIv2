const express = require("express");
const bodyParser = require('body-parser');
const { token } = require("#config/core/api");
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

    // Get the request
    let request = req.body;

    // Authenticate?
    if (request.token != token) {
        res.status(403).json({
            error: "Insufficient Permissions",
            desc: "You are not authenticated",
            content: null,
        });
        return;
    }

    // See if text even exists
    const { text } = request;
    if (text) {
        res.status(400).json({
            error: "Malformed Request",
            desc: "Your request does not contain the required information. (text)",
            content: null,
        })
        return;
    }

    const result = await addAdvert(text)
    if (result.error) {
        res.status(result.status).json({
            error: result.title,
            desc: result.desc,
            content: result.content,
        })
        return;
    }
    res.status(result.status).json({
        error: false,
        desc: result.desc,
        content: result.content,
    })
    return;
})

router.delete('/', jsonParser, async (req, res) => {

    // Get the request
    let request = req.body;

    // Authenticate?
    if (request.token != token) {
        res.status(403).json({
            error: "Insufficient Permissions",
            desc: "You are not authenticated",
            content: null,
        });
        return;
    }

    // See if text even exists
    const { text } = request;
    if (!text) {
        res.status(400).json({
            error: "Malformed Request",
            desc: "Your request does not contain the required information. (text)",
            content: null,
        })
        return;
    }

    // Remove the advertisement
    const result = await delAdvert(text)
    if (result.error) {
        res.status(result.status).json({
            error: result.title,
            desc: result.desc,
            content: result.content,
        })
        return;
    }
    res.status(result.status).json({
        error: false,
        desc: result.desc,
        content: result.content,
    })
})

router.mountPath = '/advert';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}