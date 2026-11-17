const Sequelize = require('sequelize');

// Analytics module
// This tracks analytics across NexAPI lol
const analytics = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: null,
	// SQLite only
	storage: 'analytics.sqlite',
});

// blacklist lol
const blacklist = analytics.define('blacklist', {
	user: {
		type: Sequelize.STRING,
	},
	userid: {
		type: Sequelize.STRING,
		unique: true,
	},
	timeStamp: {
		type: Sequelize.STRING,
	},
});

module.exports = {
    blacklist,
    analytics,
    async execute(){
        blacklist.sync();
    }
}