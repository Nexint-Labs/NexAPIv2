const { currency } = require("#preload/db/currency");
const { updateItem } = require("../handleItems");
const { queryItemNameId } = require("../core/queryItems");
const { openLootBox } = require("./lootBoxOdds");

const updateLootBox = async function (userId, id, qty) {
    // Resolve the item first
    const item = await queryItemNameId(id);

    if (item === undefined) {
        return {
            error: true,
            status: 404,
            title: "Item Not Found",
            desc: "The specified item does not exist.",
            content: null
        };
    }

    if (!Number.isSafeInteger(qty) || qty < 1 || qty > 1000000) {
        return {
            error: true,
            status: 400,
            title: "Invalid Quantity",
            desc: "Quantity must be between 1 and 1,000,000.",
            content: null
        };
    }

    // Generate rewards and validate the lootbox

    try {
        const content = await currency.transaction(async t => {
            // Consume the lootboxes
            const consumed = await updateItem(userId, String(item.id), -qty, t, false, qty);

            if (consumed.error) {
                throw consumed;
            }
            const result = await openLootBox(item.id, qty);

            if (result.error) {
                throw result
            }

            const rewards = result.content;

            // Award the rewards
            const newBalances = [];

            for (let i = 0; i < rewards.ids.length; i++) {
                const rewarded = await updateItem(userId, String(rewards.ids[i]), rewards.qty[i], t);

                if (rewarded.error) {
                    throw rewarded
                }

                newBalances.push(rewarded.content.value);
            }

            return {
                box: consumed.content,
                ids: rewards.ids,
                qty: rewards.qty,
                newBalances: newBalances
            };
        });

        return {
            error: false,
            status: 200,
            title: "Opened Lootboxes",
            desc: "Lootboxes opened successfully.",
            content: content
        };

    } catch (error) {
        if (error?.error === true) {
            return error;
        }
        return {
            error: true,
            status: 500,
            title: "Lootbox Transaction Failed",
            desc: error.message,
            content: null
        };
    }
};

module.exports = {
    updateLootBox
};