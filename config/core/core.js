module.exports = {
    devMode: false, // Determines dev mode?
    devMsg: "This bot is running in dev mode. Developer functions are enabled.",
    devName: "Nexint",
    dateOptions: {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
    },
    verbose: true, // Extra Logging Info
    autoUpdate: false,
    frameName: "Prism", // Unified Framework Name
    frameVer: "0.7.0-dev", // Unified Framework version
    frameID: 13, // Framework version ID
    updateURL: "https://github.com/Nexint-Labs/NexAPIv2/",
    updateSource: "https://raw.githubusercontent.com/Nexint-Labs/NexAPIv2/refs/heads/main/ver.txt",

    restart: "start start.bat", // Restart command. This would be different on a linux based system. It would be "sh start.sh".
    // args: ['--', 'bash', '-c', "./start.sh"],
}