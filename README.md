# Run command in a container of ECS task

This action allows you to run a command in a container of ECS task.

# Usage

\[suggestion\] use `aws-actions/configure-aws-credentials@v1` first

Add the following step to your workflow:

```yaml
- name: Migrate database
  id: migrate-database
  uses: django-wong/run-command-in-ecs-task-container@main
  with:
    task-definition-family: ${{ env.ECS_TASK_FAMILY }}
    container: ${{ env.ECS_TASK_CONTAINER_NAME  }}
    cluster: ${{ env.ECS_CLUSTER }}
    launch-type: EC2
    command: php artisan migrate
```
