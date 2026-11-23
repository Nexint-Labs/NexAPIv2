const express = require('express');
const { app } = require('#apps/web');
const { authReq } = require('#functions/api/auth');
const { addMisc } = require('#functions/dbs/currency/handleMisc');
const { currency } = require('#preload/db/currency');
const { log } = require('#functions/core/log.mjs');

const router = express.Router();

router.post('/', express.json(), async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { userId, name, robbable } = request;

    if (!userId || !name || typeof robbable !== 'boolean') {
        return res.status(400).json({
            error: true,
            status: 400,
            title: 'Malformed Request',
            desc: 'Missing or invalid user information.',
            content: null
        });
    }

    try {
        const result = await currency.transaction(async t => {
            const misc = await addMisc(userId, name, t);
            if (misc.error) {
                throw misc
            };

            await misc.content.update({
                robbable
            }, {
                transaction: t
            });

            return {
                error: false,
                status: 200,
                title: 'Robbery Settings Updated',
                desc: 'Your robbery preference has been updated.',
                content: {
                    robbable
                }
            };
        });

        return res.status(200).json(result);
    } catch (error) {
        if (error?.error === true) {
            return res.status(error.status).json(error);
        }

        log.error('Failed to update robbery settings.', error);

        return res.status(500).json({
            error: true,
            status: 500,
            title: 'Update Failed',
            desc: 'An unexpected error occurred.',
            content: null
        });
    }
});

router.mountPath = '/currency/rob/toggle';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router);
    }
};