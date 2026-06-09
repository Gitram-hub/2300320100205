const Log = require("./logger");

async function main() {
    await Log(
        "backend",
        "info",
        "service",
        "Application started"
    );

    await Log(
        "backend",
        "error",
        "handler",
        "received string, expected bool"
    );

    await Log(
        "backend",
        "fatal",
        "db",
        "Critical database connection failure."
    );

    await Log(
        "frontend",
        "warn",
        "middleware",
        "Slow response from backend API."
    );
}

main();