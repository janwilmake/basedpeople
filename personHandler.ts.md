Consider `/people.json` containing `Array<{name:string,slug:string,summary:string,category:string}>` and `env.KV` with key `person:{slug}` containing a JSON in format of the result of a task: https://docs.parallel.ai/api-reference/task-api-v1/retrieve-task-run-result.md with result being JSON of Schema:
https://uithub.com/janwilmake/basedpeople/blob/main/search-task.schema.json

You can access people.json and dummy.json over env.ASSETS fetcher

If the person that does exist in people does not exist in the KV, use content of dummy.json

The style we're going for: https://pastebin.contextarea.com/RO9mV1Y.md

Please create a `personHtmlHandler(request,env)` that constructs a server-side rendered HTML for an appearances page for the person with given slug (route is `/{slug}.html`).

Show it all in a single reverse-chronological table, but make it possible to easily filter on type or one or more keywords by adding these as buttons at the top.

Please design beautifully with the same style and ensure the response is utf8 encoded html
https://flaredream.com/system-ts.md
