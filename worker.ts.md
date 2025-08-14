https://flaredream.com/system-ts.md
Create a cloudflare worker with KV and assets in Env.

- `/seed?secret={env.CRON_SECRET}` goes over each person in `people.json` and starts a task with input being the content of `search-task.md` (replace {{name}} with the person name) and output schema `search-task.schema.json` and metadata `{slug}` (fetch these from `env.ASSETS` fetcher)
- `/webhook` retrieves the result of the task and stores the full JSON in `env.KV` under key `person:{slug}`
- Context: Tasks with webhooks: https://docs.parallel.ai/api-reference/task-api-v1/create-task-run https://docs.parallel.ai/task-api/features/webhooks
- Hosted at https://basedpeople.com (for webhook)
- `/{slug}.json` retrieves the result stored in KV
