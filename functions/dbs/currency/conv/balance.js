const { balance } = require("#preload/db/currency");


const convNameToID = async function (name) {
    try {
        let balanceUser = await balance.findOne({
            where: { name: name }
        });

        if (balanceUser === null) {

            return {
                error: false,
                status: 200,
                title: "Balance List",
                desc: `List of balance accounts:`,
                content: null
            }

        }

        return {
            error: false,
            status: 200,
            title: "Balance Name",
            desc: `Balance name:`,
            content: balanceUser.name
        }
    } catch (error) {
        // Some error has occured lol
        log("ERROR", "A server error has happened while trying to query blacklists..")
        console.error(error)
        return {
            error: true,
            status: 500,
            title: "Server Error",
            desc: "The server in question has faced a serious server error.",
            content: null,
        }

    }
};

module.exports = {
    convNameToID
}