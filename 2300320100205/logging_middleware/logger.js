const axios = require("axios");
require("dotenv").config();

const VALID_STACKS = ["backend", "frontend"];

const VALID_LEVELS = [
    "debug",
    "info",
    "warn",
    "error",
    "fatal"
];

const VALID_PACKAGES = [
    "cache",
    "controller",
    "cron_job",
    "db",
    "domain",
    "handler",
    "repository",
    "route",
    "service",
    "auth",
    "config",
    "middleware",
    "utils"
];

async function Log(stack, level, packageName, message) {
    try {
        if (!VALID_STACKS.includes(stack)) {
            throw new Error("Invalid stack");
        }

        if (!VALID_LEVELS.includes(level)) {
            throw new Error("Invalid level");
        }

        if (!VALID_PACKAGES.includes(packageName)) {
            throw new Error("Invalid package");
        }
       console.log(process.env.TOKEN);
        const response = await axios.post(
            "http://4.224.186.213/evaluation-service/logs",
            {
                stack,
                level,
                package: packageName,
                message
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("Log created successfully");
        console.log(response.data);

        return response.data;
    } catch (error) {
        console.error(
            "Logging failed:",
            error.response?.data || error.message
        );
    }
}

module.exports = Log;