const { currency, balance, multi } = require("#preload/db/currency");
const { updateItem } = require("../handleItems");
const { addMulti, getMultiDetails } = require("../handleMulti");
const { queryItemNameId } = require("../core/queryItems");
const { log } = require("#functions/core/log.mjs");

// Item ID comes before quantity, matching the current useItem call order
const consumeMulti = async function (userId, itemId, qty) {
    if (!Number.isSafeInteger(qty) || qty <= 0) {
        return {
            error: true,
            status: 400,
            title: "Invalid Quantity",
            desc: "Quantity must be a positive whole number.",
            content: null
        };
    }

    const item = await queryItemNameId(itemId);
    const effect = item?.effects?.multiplier;

    if (
        !effect ||
        !effect.name ||
        !Number.isFinite(effect.value) ||
        effect.value <= 0 ||
        !Number.isSafeInteger(effect.duration) ||
        effect.duration <= 0
    ) {
        return {
            error: true,
            status: 400,
            title: "Invalid Multiplier",
            desc: "Item does not have a valid multiplier effect.",
            content: null
        };
    }

    const duration = effect.duration * qty;
    if (!Number.isSafeInteger(duration)) {
        return {
            error: true,
            status: 400,
            title: "Invalid Duration",
            desc: "Multiplier duration is too large.",
            content: null
        };
    }

    try {
        const content = await currency.transaction(async t => {
            // Consume the item
            const consumed = await updateItem(userId, String(item.id), -qty, t);
            if (consumed.error) {
                throw consumed;
            }

            // Check for a legacy permanent multiplier before extending it
            const previous = await multi.findOne({
                where: {
                    userId: userId,
                    name: effect.name
                },
                transaction: t
            });

            const permanent = previous && previous.value > 0 && previous.expire == null;

            // Extend the multiplier using the existing NexAPI method
            const updated = await addMulti(userId, effect.name, 1, effect.value, duration, t);

            if (updated.error) {
                throw updated;
            }

            const record = updated.content;

            // Preserve the extra duration for legacy permanent sushi
            if (permanent) {
                await record.increment('expire', {
                    by: effect.duration,
                    transaction: t
                });
                await record.reload({ transaction: t });
            }

            const nextExpiry = Number(record.expire);
            if (!Number.isFinite(nextExpiry)) {
                throw new Error('INVALID_MULTIPLIER_EXPIRY');
            }

            // Use the existing multiplier calculator
            const details = await getMultiDetails(userId, t);
            if (details.error) {
                throw details;
            }

            // Keep the cached wallet multiplier up to date
            await balance.update({
                multiplier: details.content.total
            }, {
                where: { userId: userId },
                transaction: t
            });

            return {
                inventory: consumed.content,
                item: record,
                nextExpiry: nextExpiry
            };
        });

        return {
            error: false,
            status: 200,
            title: "Used Multiplier",
            desc: "Multiplier extended.",
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
            desc: "Could not consume multiplier.",
            content: null
        };
    }
};

module.exports = { consumeMulti };
