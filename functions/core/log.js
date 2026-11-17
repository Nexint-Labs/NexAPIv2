const { dateOptions } = require('#config/core/core')
const DateFormatter = new Intl.DateTimeFormat(undefined, dateOptions)
const log = function (type, text) {
    console.log(`[${type}] [${DateFormatter.format(Date.now())}] ${text}`);
}

module.exports = {
    log
}