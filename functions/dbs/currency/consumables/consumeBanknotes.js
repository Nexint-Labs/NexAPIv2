const { log } = require("#functions/core/log.mjs");
const { currency, bank } = require("#preload/db/currency");
const { updateItem } = require("../handleItems");

const consumeBanknotes = async function (userId, qty) {
    if (!Number.isSafeInteger(qty) || qty <= 0) {
        return {
            error: true,
            status: 400,
            title: "Invalid Quantity",
            desc: "Quantity must be a positive whole number.",
            content: null
        };
    }

    try {
        const content = await currency.transaction(async t => {
            // Consume the banknotes first
            const consumed = await updateItem(userId, "3", -qty, t);
            if (consumed.error) {
                throw consumed;
            }

            // Get the existing bank account
            const vault = await bank.findOne({
                where: { userId: userId },
                transaction: t
            });

            if (!vault) {
                throw {
                    error: true,
                    status: 404,
                    title: "Bank Not Found",
                    desc: "Bank account does not exist.",
                    content: null
                };
            }

            // Each banknote increases capacity by approximately 500,000
            const bankValue = 500000 * ((Math.random() / 5) + 0.9);
            const increase = bankValue * qty;
            const nextMaxValue = vault.maxValue + increase;

            if (!Number.isFinite(increase) || !Number.isFinite(nextMaxValue)) {
                throw {
                    error: true,
                    status: 400,
                    title: "Invalid Bank Capacity",
                    desc: "Bank capacity would be unsafe.",
                    content: null
                };
            }

            // Update bank capacity within the same transaction
            await vault.update({
                maxValue: nextMaxValue
            }, {
                transaction: t
            });

            return {
                inventory: consumed.content,
                vault: vault,
                increase: increase
            };
        });

        return {
            error: false,
            status: 200,
            title: "Used Banknotes",
            desc: "Bank capacity increased.",
            content: content
        };
    } catch (error) {
        if (error.error) {
            return error;
        }
        log.error('[Currency] Banknote consumption failed:', error)
        return {
            error: true,
            status: 500,
            title: "Server Error",
            desc: "Could not consume banknotes.",
            content: null
        };
    }
};

module.exports = { consumeBanknotes };
