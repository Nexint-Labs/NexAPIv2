const { token } = require("#config/core/api");

/**
 * Authenticate user
 * Returns true if authenticated.
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @returns 
 */
const authReq = function (req, res) {

    // Check legitimacy
    if (typeof token !== "string" || token.length === 0) {
        res.status(403).json({
            error: true,
            status: 403,
            title: "Insufficient Permissions",
            desc: "You are not authenticated",
            content: null,
        });
        return false;
    }

    if (token.length < 8) {
        res.status(403).json({
            error: true,
            status: 403,
            title: "Insufficient Permissions",
            desc: "You are not authenticated",
            content: null,
        });
        return false;
    }

    // Authenticate?
    if (req.body?.token !== token) {
        res.status(403).json({
            error: true,
            status: 403,
            title: "Insufficient Permissions",
            desc: "You are not authenticated",
            content: null,
        });
        return false;
    }
    return true;
}

module.exports = {
    authReq
}