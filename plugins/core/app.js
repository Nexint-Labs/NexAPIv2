const { app } = require(`#index`);

module.exports = {
    async execute() {

        // Get the slash directory?
        app.get('/', (req, res) => {
            return res.json({
                status: "Loaded."
            })
        });
    }
}