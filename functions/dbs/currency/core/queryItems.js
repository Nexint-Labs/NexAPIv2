const { items } = require("#config/eco/currency");

/**
 * Query based on item name
 * @param {String} name 
 * @returns 
 */
const queryItemName = async function(name){
    for(const item of items){
        if(name == item.name){
            return item
        }
    }
    return undefined;
}

/**
 * Query based on item ID
 * @param {String} id 
 * @returns 
 */
const queryItemId = async function(id){
    for(const item of items){
        if(id == item.id){
            return item;
        }
    }
    return undefined;
}

/**
 * Query based on everything.
 * @param {String} query 
 * @returns 
 */
const queryItemNameId = async function(query){
    let item;
    item = await queryItemName(query);
    if(item !== undefined){
        return item;
    }
    item = await queryItemId(query);
    if(item !== undefined){
        return item;
    }
    return undefined;
}

module.exports = {
    queryItemId,
    queryItemName,
    queryItemNameId
}