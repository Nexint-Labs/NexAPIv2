const express = require("express");
const bodyParser = require('body-parser');
const { app } = require("#apps/web");
const { authReq } = require("#functions/api/auth");
const { addBalance, updateBalance } = require("#functions/dbs/currency/handleBalance");
const { currency } = require("#preload/db/currency");
const { log } = require("#functions/core/log.mjs");
const router = express.Router()
const jsonParser = bodyParser.json()
const { addMisc } = require("#functions/dbs/currency/handleMisc");

// Version info
router.get('/', jsonParser, async (req, res) => {

    // Status of balance
    res.json({
        name: "Robbery",
        desc: "Status of robbing lol",
        content: {
            // 0 means offline, 1 means online
            status: 1,
            version: 2,
        },
        refreshDate: Date.now(),
        error: false,
    })
})

// Transfers money from one user to another.
// yes
router.post('/', jsonParser, async (req, res) => {

    // Authenticate
    if (!authReq(req, res)) return;

    // Get the request
    let request = req.body;

    // See if the user ID even exists
    const { robberId, robberName, victimId, victimName } = request;
    if (!robberId || !robberName || !victimId || !victimName) {
        res.status(400).json({
            error: true,
            status: 400,
            title: "Malformed Request,",
            desc: "Your request does not contain the required information.",
            content: null,
        })
        return;
    }

    if (robberId === victimId) {
        return res.status(400).json({
            error: true,
            status: 400,
            title: "Invalid Transfer",
            desc: "You cannot transfer money to yourself.",
            content: null
        });
    }

    try {
        const result = await currency.transaction(async t => {
            const robberMisc = await addMisc(robberId, robberName, t);
            if (robberMisc.error) {
                throw robberMisc;
            }

            const victimMisc = await addMisc(victimId, victimName, t);
            if (victimMisc.error) {
                throw victimMisc;
            }

            if (!robberMisc.content.robbable || !victimMisc.content.robbable) {
                throw {
                    error: true,
                    status: 403,
                    title: "Robbery Disabled",
                    desc: "One of the users has disabled robbery.",
                    content: null
                };
            }

            const now = Math.floor(Date.now() / 1000);

            if (now - Number(victimMisc.content.lastRobbed) < 86400) {
                throw {
                    error: true,
                    status: 409,
                    title: "Robbery Protection",
                    desc: "This user has already been robbed within the past 24 hours.",
                    content: {
                        nextRobbery: Number(victimMisc.content.lastRobbed) + 86400
                    }
                };
            }

            // Victim's current balance must be fetched within this transaction
            const victim = await addBalance(victimId, victimName, t);
            if (victim.error) {
                throw victim;
            }

            const victimBalance = victim.content.value;

            if (victimBalance <= 0) {
                throw {
                    error: true,
                    status: 404,
                    title: "Invalid Robbery",
                    desc: "You cannot rob someone with zero coins.",
                    content: null
                };
            }

            const fee = 1000;

            // Charge robber
            const feeResult = await updateBalance(robberId, robberName, -fee, t);
            if (feeResult.error) {
                throw feeResult
            };

            const rng = Math.random();

            let outcome = "FAILED";
            let addedCoins = 0;
            let robberBalance = feeResult.content.value;
            let newVictimBalance = victimBalance;

            if (rng < 0.5) {
                // Failure: victim receives the fee
                const victimResult = await updateBalance(victimId, victimName, fee, t);
                if (victimResult.error) {
                    throw victimResult;
                }

                newVictimBalance = victimResult.content.value;

            } else {
                // Success: calculate stolen amount
                if (rng < 0.9) {
                    outcome = "SUCCESS";
                    addedCoins = Math.floor(victimBalance / (4 + Math.random() * 6));
                } else {
                    outcome = "JACKPOT";
                    addedCoins = victimBalance;
                }

                await victimMisc.content.update({
                    lastRobbed: String(now)
                }, { transaction: t });

                // Remove coins from victim
                const victimResult = await updateBalance(victimId, victimName, -addedCoins, t);
                if (victimResult.error) {
                    throw victimResult;
                }

                // Refund fee and award stolen coins
                const robberResult = await updateBalance(robberId, robberName, addedCoins + fee, t);
                if (robberResult.error) {
                    throw robberResult;
                }

                robberBalance = robberResult.content.value;
                newVictimBalance = victimResult.content.value;
            }

            return {
                error: false,
                status: 200,
                title: "Robbed.",
                desc: "Robbery attempt completed.",
                content: {
                    outcome,
                    addedCoins,
                    robberBalance,
                    victimBalance: newVictimBalance
                }
            };
        });
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
            desc: "An unexpected error occurred while robbing money.",
            content: null
        });
    }
    return;
})

router.mountPath = '/currency/transfer/rob';

module.exports = {
    async execute() {
        app.use('/api/v1' + router.mountPath, router)
    }
}