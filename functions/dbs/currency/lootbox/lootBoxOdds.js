
const { lootboxes } = require("#config/eco/lootbox");
const { queryItemNameId, queryItemId } = require("../core/queryItems");

/**
 * Lootbox opener
 * @param {String} id 
 * @param {Number} qty 
 * @returns 
 */
const openLootBox = async function (id, qty) {
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

    const schema = lootboxes.get(Number(item.id));

    if (schema === undefined) {
        return {
            error: true,
            status: 400,
            title: "Invalid Lootbox",
            desc: "The specified item is not a lootbox.",
            content: null
        };
    }

    // Quantity Limits
    if (!Number.isSafeInteger(qty) || qty < 1 || qty > 1000000) {
        return {
            error: true,
            status: 400,
            title: "Invalid Quantity",
            desc: "Quantity must be between 1 and 1,000,000.",
            content: null
        };
    }

    // tally up all the chances
    let chance = 0;
    for (let i = 0; i < schema.length; i++) {
        chance += schema[i].chance
    }

    // Pick something
    let itemIDs = [];
    let itemQty = [];

    for (let i = 0; i < qty; i++) {
        let rng = Math.floor(Math.random() * chance); // Pick a random number within the confines.
        let choice = 0; // The choice to select
        let tmp = 0; // temp variable tallying everything
        while (tmp <= rng) {
            tmp += schema[choice].chance;
            choice += 1;
        }

        // get the chosen item
        let item = schema[choice - 1];

        // check for overlap
        let overlap = false;
        for (let j = 0; j < itemIDs.length; j++) {
            if (itemIDs[j] == item.item) {
                overlap = true;
                itemQty[j] += item.qty;
                break;
            }
        }
        if (!overlap) {
            itemIDs.push(item.item);
            itemQty.push(item.qty);
        }
        if ((i + 1) % 10000 === 0) {
            await new Promise(resolve => setImmediate(resolve));
        }
    }

    let itemTotal = {
        ids: itemIDs,
        qty: itemQty
    }


    return {
        error: false,
        status: 200,
        title: "Opened Lootboxes",
        desc: "real",
        content: itemTotal
    };
}

/**
 * Get lootboxes lol
 * @param {String} id 
 * @returns 
 */
const getLootBox = async function (id) {
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

    const schema = lootboxes.get(Number(item.id));

    if (schema === undefined) {
        return {
            error: true,
            status: 400,
            title: "Invalid Lootbox",
            desc: "The specified item is not a lootbox.",
            content: null
        };
    }

    // Tally up all the chances
    let chance = 0;

    for (let i = 0; i < schema.length; i++) {
        chance += schema[i].chance;
    }

    let totalChances = [];
    let items = [];
    let names = [];
    let itemQty = [];
    let numericChance = [];

    for (let i = 0; i < schema.length; i++) {
        const reward = await queryItemId(schema[i].item)

        if (reward === undefined) {
            return {
                error: true,
                status: 500,
                title: "Invalid Lootbox Configuration",
                desc: "A reward item does not exist in the catalog.",
                content: null
            };
        }
        
        items.push(reward.id);
        names.push(reward.name);
        itemQty.push(schema[i].qty);
        totalChances.push(schema[i].chance / chance);
        numericChance.push(schema[i].chance);
    }

    let itemTotal = {
        ids: items,
        qty: itemQty,
        names: names,
        chance: totalChances,
        numericChance: numericChance,
        totalChance: chance,
        name: item.name
    };

    return {
        error: false,
        status: 200,
        title: "Lootbox Odds",
        desc: "real lootbox odds.",
        content: itemTotal
    };
};

module.exports = {
    openLootBox,
    getLootBox
};
