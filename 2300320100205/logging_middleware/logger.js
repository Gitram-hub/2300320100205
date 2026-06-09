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

function isValidText(value) {
    return typeof value === "string" && value.trim().length > 0;
}

async function Log(stack, level, packageName, message) {
    try {
        if (!VALID_STACKS.includes(stack)) {
            throw new Error("Invalid stack");
        }

        if (!VALID_LEVELS.includes(level)) {
            throw new Error("Invalid level");
        }

        if (!VALID_PACKAGES.includes(packageName)) {
            throw new Error("Invalid package name");
        }

        if (!isValidText(message)) {
            throw new Error("Invalid message");
        }

        const token = process.env.TOKEN || process.env.BEARER_TOKEN;

        if (!token) {
            throw new Error("Missing bearer token");
        }

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
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "Logging failed:",
            error.response?.data || error.message
        );

        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

module.exports = Log;