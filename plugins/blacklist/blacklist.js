const express = require("express");
const bodyParser = require('body-parser');
const { blacklist } = require("#preload/db/analytics");
const { analytics } = require("#preload/db/analytics");
const { token } = require("#config/core/api");
const { addBlacklist, delBlacklist } = require("#functions/dbs/blacklist/handleBlacklist");
const { app } = require("#apps/web");
const router = express.Router()
const jsonParser = bodyParser.json()

router.get('/', jsonParser, async (req, res) => {

    // Find all blacklists
    const listBlacklist = await blacklist.findAll();
    const getBlacklist = [];
    const getBlacklistName = [];
    listBlacklist.forEach(async id => {
        getBlacklist.push(id.userid);
        getBlacklistName.push(id.user);
    })

    // Return the blacklist
    res.json({
        name: "Blacklist",
        desc: "Info of the blacklist",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 1,
            blacklist: getBlacklist,
            blacklistName: getBlacklistName,
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
        });
        return;
    }

    // See if the user ID even exists
    const { userId, name } = request;
    if (!userId || !name) {
        res.status(400).json({
            error: "Malformed Request",
            desc: "Your request does not contain the required information. (userID, name)"
        })
    }

    const result = await addBlacklist(userId, name)
    if (result.error) {
        res.status(result.status).json({
            error: result.title,
            desc: result.desc,
        })
        return;
    }
    res.status(result.status).json({
        error: false,
        desc: result.desc,
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
        });
        return;
    }

    // See if the user ID even exists
    const { userId, name } = request;
    if (!userId || !name) {
        res.status(400).json({
            error: "Malformed Request",
            desc: "Your request does not contain the required information. (userID)"
        })
    }

    // Remove the user
    const result = await delBlacklist(userId, name)
    if (result.error) {
        res.status(result.status).json({
            error: result.title,
            desc: result.desc,
        })
        return;
    }
    res.status(result.status).json({
        error: false,
        desc: result.desc,
    })
})

router.mountPath = '/blacklist';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}