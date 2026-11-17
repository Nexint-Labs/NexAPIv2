const Sequelize = require('sequelize');

// Analytics module
// This tracks analytics across NexAPI lol
const analytics = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: null,
	// SQLite only
	storage: 'databases/analytics.sqlite',
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

// blacklist lol
const advert = analytics.define('advert', {
	name: {
		type: Sequelize.STRING,
		unique: true,
	},
});

module.exports = {
    blacklist,
	advert,
    analytics,
    async execute(){
        blacklist.sync();
		advert.sync();
    },
    async close(){
        await analytics.close();
    }
}