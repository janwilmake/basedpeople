# Based People

[X Thread](https://x.com/janwilmake/status/1956061673833300443) | [HN Thread](https://news.ycombinator.com/item?id=44914035)

Based People is a proof of concept of a website that scrapes and neatly organizes a complete overview of all public appearances of highly influential people in the tech scene. To get and maintain this dataset, the [Parallel Task API](https://docs.parallel.ai/task-api/task-quickstart) is used which is an agentic deep research API.

Cost analysis:

- Scrapes 164 people
- Using ultra processor a $0.3 per task, meaning $50 for the initial seed

For testing tasks, [people-test.json](people-test.json) is used to reduce cost while experimenting with task enhancements.

For the origin story and further changes made, see [the changelog](CHANGELOG.md)

The next steps will be:

- ✅ Simplify the code using https://github.com/janwilmake/simplerauth-provider and with that, fixing localhost development
- Doing the initial seed in multiple steps to get full history, but optimize for cost (as few and as light tasks as possible)
- Verify with some degree of confidence that no items are missing
- Doing a frequent scheduled task for each person (e.g. daily) to get all NEW things, without having to re-scrape all older material that I already have. Optimize for cost here too.
- Write about Based People in this slightly longer form format in a [similar way as this](https://cookbook.openai.com/examples/partners/temporal_agents_with_knowledge_graphs/temporal_agents_with_knowledge_graphs)
- Write about balancing cost with effort

# BACKLOG

- Analytics: Simple Analytics
- Add readonly query and expose over MCP
- Monetization:
  - add free limits and $20/m plan
  - think about enterprise offering (firehose)
- Use login.wilmake.com to simplify stack
- Experiment with different API configurations
- Experiment with a more agentic and efficient task schedule per person over MCP
- Appearance level task for more depth!!
