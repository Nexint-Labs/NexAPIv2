const express = require("express");
const bodyParser = require('body-parser');
const { token } = require("#config/core/api");
const { getBlacklist, addBlacklist, delBlacklist } = require("#functions/dbs/blacklist/handleBlacklist");
const { app } = require("#apps/web");
const router = express.Router()
const jsonParser = bodyParser.json()

router.get('/', jsonParser, async (req, res) => {

    // Find all blacklists
    const listBlacklist = await getBlacklist();

    // Return the blacklist
    res.json({
        name: "Blacklist",
        desc: "Info of the blacklist",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
            blacklist: listBlacklist.content,
        },
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

    // See if the user ID even exists
    const { userId, name } = request;
    if (!userId || !name) {
        res.status(400).json({
            error: "Malformed Request",
            desc: "Your request does not contain the required information. (userID, name)",
            content: null,
        })
        return;
    }

    const result = await addBlacklist(userId, name)
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

    // See if the user ID even exists
    const { userId, name } = request;
    if (!userId || !name) {
        res.status(400).json({
            error: "Malformed Request",
            desc: "Your request does not contain the required information. (userID)",
            content: null,
        })
        return;
    }

    // Remove the user
    const result = await delBlacklist(userId, name)
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

router.mountPath = '/blacklist';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}