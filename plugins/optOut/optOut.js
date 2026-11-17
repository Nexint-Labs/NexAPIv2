const { app } = require("#apps/web");

module.exports = {
    async execute() {

        // Get the slash directory?
        app.get('/api/v1/optOut', (req, res) => {
            return res.json({
                status: "Opted out."
            })
        });
    }
}