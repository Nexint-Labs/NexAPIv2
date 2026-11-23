const { currency } = require("#preload/db/currency");
const { updateItem } = require("../handleItems");
const { updateBalance } = require("../handleBalance");
const { queryItemNameId } = require("../core/queryItems");

const buyItem = async function (userId, name, id, qty) {
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

    if (!item.available) {
        return {
            error: true,
            status: 400,
            title: "Item Unavailable",
            desc: "This item cannot be purchased.",
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

    const price = item.value * qty;

    if (!Number.isSafeInteger(price) || price < 0) {
        return {
            error: true,
            status: 400,
            title: "Invalid Price",
            desc: "The purchase price is invalid.",
            content: null
        };
    }

    // Generate rewards and validate the lootbox

    try {
        const content = await currency.transaction(async t => {
            // Consume the lootboxes

            const balance = await updateBalance(userId, name, -price, t);

            if (balance.error) {
                throw balance;
            }

            const inventory = await updateItem(userId, String(item.id), qty, t);

            if (inventory.error) {
                throw inventory;
            }

            return {
                user: balance.content,
                itemUser: inventory.content
            };
        });

        return {
            error: false,
            status: 200,
            title: "Purchased Item",
            desc: "Item purchased successfully.",
            content: content
        };

    } catch (error) {
        if (error?.error === true) {
            return error;
        }
        return {
            error: true,
            status: 500,
            title: "Purchase failed.",
            desc: "An unexpected error occurred while purchasing the item.",
            content: null
        };
    }
};

module.exports = {
    buyItem
};