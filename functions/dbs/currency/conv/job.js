const { jobs } = require("#config/eco/currency");

/**
 * real
 * @param {String} jobId 
 * @returns 
 */
const queryJobInfo = async function (jobId) {
    return {
        error: false,
        status: 200,
        content: jobs[jobId] ?? null
    };
};



module.exports = {
    queryJobInfo
}