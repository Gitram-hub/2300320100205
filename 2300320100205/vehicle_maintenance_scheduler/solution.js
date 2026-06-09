const axios = require("axios");

async function fetchMaintenanceData() {
    const [depotResponse, vehicleResponse] = await Promise.all([
        axios.get("http://4.224.186.213/evaluation-service/depots"),
        axios.get("http://4.224.186.213/evaluation-service/vehicles")
    ]);

    return {
        depots: depotResponse.data.depots || [],
        vehicles: vehicleResponse.data.vehicles || []
    };
}

function solveKnapsack(tasks, capacity) {
    const taskCount = tasks.length;
    const dp = Array.from({ length: taskCount + 1 }, () =>
        Array(capacity + 1).fill(0)
    );

    for (let i = 1; i <= taskCount; i++) {
        const currentTask = tasks[i - 1];

        for (let hours = 0; hours <= capacity; hours++) {
            dp[i][hours] = dp[i - 1][hours];

            if (currentTask.duration <= hours) {
                const includeCurrentTask =
                    dp[i - 1][hours - currentTask.duration] + currentTask.impact;

                if (includeCurrentTask > dp[i][hours]) {
                    dp[i][hours] = includeCurrentTask;
                }
            }
        }
    }

    const selectedTaskIDs = [];
    let remainingHours = capacity;

    for (let i = taskCount; i >= 1; i--) {
        if (dp[i][remainingHours] !== dp[i - 1][remainingHours]) {
            const task = tasks[i - 1];
            selectedTaskIDs.push(task.TaskID);
            remainingHours -= task.duration;
        }
    }

    selectedTaskIDs.reverse();

    return {
        selectedTaskIDs,
        totalImpactScore: dp[taskCount][capacity]
    };
}

async function getBestMaintenancePlan() {
    const { depots, vehicles } = await fetchMaintenanceData();

    if (depots.length === 0) {
        return {
            selectedTaskIDs: [],
            totalImpactScore: 0
        };
    }

    const mechanicHours = depots[0].MechanicHours;

    return solveKnapsack(vehicles, mechanicHours);
}

if (require.main === module) {
    getBestMaintenancePlan()
        .then((result) => {
            console.log(JSON.stringify(result, null, 2));
        })
        .catch((error) => {
            console.error("Failed to compute maintenance plan:", error.message);
        });
}

module.exports = {
    fetchMaintenanceData,
    solveKnapsack,
    getBestMaintenancePlan
};