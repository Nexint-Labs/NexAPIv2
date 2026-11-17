const { app } = require("#apps/web");

module.exports = {
    async execute() {

        // Get the slash directory?
        app.get('/', (req, res) => {
            return res.json({
                status: "Welcome to the Nexint API!"
            })
        });
    }
}