import * as core from "@actions/core";
import { ECS } from "aws-sdk";

const R_T = { required: true, trimWhitespace: true };
const O_T = { required: false, trimWhitespace: true };

async function _run() {
	const taskDefinitionFamily = core.getInput("task-definition-family", R_T);

	const container = core.getInput("container", R_T);

	const cluster = core.getInput("cluster", R_T);

	const launchType = core.getInput("launch-type", O_T);

	const command = core.getInput("command", R_T);

	const waitForTaskStopped = core.getBooleanInput(
		"wait-for-task-stopped",
		O_T
	);

	const waitForMinutes = core.getInput("wait-for-minutes", O_T);

	const ecs = new ECS();

	const { taskDefinition } = await ecs
		.describeTaskDefinition({
			taskDefinition: taskDefinitionFamily,
		})
		.promise();

	if (!taskDefinition || !taskDefinition.taskDefinitionArn) {
		throw new Error("Unable to find task definition");
	}

	const response = await ecs
		.runTask({
			cluster: cluster,
			taskDefinition: taskDefinition.taskDefinitionArn,
			count: 1,
			startedBy: "github-action",
			launchType: launchType || "EC2",
			overrides: {
				containerOverrides: taskDefinition.containerDefinitions?.map(
					(containerDefinition) => {
						let localCommand: string[] | null = null;
						if (
							containerDefinition.name!.match(
								new RegExp(container)
							)
						) {
							localCommand = [command];
						}
						return {
							command:
								localCommand || containerDefinition.command,
						};
					}
				),
			},
		})
		.promise();

	if (response.tasks?.length === 0) {
		throw new Error(
			"Unable to run the task. Please check the cluster has enough resources to place this task."
		);
	}

	const tasksArn: string[] = [];

	(response.tasks || [])?.forEach((task) => {
		if (task.taskArn) {
			tasksArn.push(task.taskArn);
		}
	});

	const maxAttempts = (parseInt(waitForMinutes || "15") * 60) / 15;

	waitForTaskStopped &&
		(await ecs
			.waitFor("tasksStopped", {
				tasks: tasksArn,
				cluster: cluster,
				$waiter: {
					delay: 15,
					maxAttempts: maxAttempts,
				},
			})
			.promise());
}

_run();
