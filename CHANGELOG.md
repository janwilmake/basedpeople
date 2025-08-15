# August 14 2025 - first implementation

- ✅ Step 1: Improve tasks with small dataset (±5 people) - (very famous and less famous person): historical and weekly. Vibe-test for errors and cost.
- ✅ Build dataset of hitoric appearances of 164 individuals
- ✅ Personalization: Add login and ability to follow
- ✅ **Validate Assumption: the data is high-quality enough, the cost per month is under $500 for the POC**
- ✅ Share on X (https://x.com/janwilmake/status/1956061673833300443)
- ✅ Make the whole card clickable rather than just the view button
- ✅ Fix buggy follow system. Remove unneeded `localStorage` complexity, Just API + DOM.

**The origin story**

Ok so recently I discovered Parallel and I have had this idea for a long time... What if you could follow people across the entire internet? Famous people usually have lots of different places in the world where they appear and the online documentation of that is usually scattered across many places. But I want a way to follow specific people in a single place. Following them on their respective social media platforms isn't enough, it's too scatered and incomplete because they don't post about everything.

Parallel seems like a great way to try and gather this type of data!

Here's the spec that I came up with....

Goal: to build a database of public appearances of high-profile people.

SPEC:

- A good task to get historical data (longer period) for a person that is sufficiently reliable. Maybe, a single task is enough.
- A daily cronjob that queues 1/7th of people in the batch API for the last 7 days
- Storage: Unique Durable object
  - Tasks table with raw prompts/results.
  - Appearances table (see `people.ts`)
  - Users table with `{ ...x_profile, actions_today:integer, is_premium, follows: {name:string,notify:"weekly"|"instant"}[] }`
- `list.html`
  - KV: `/{name-slug}.html` and `/{name-slug}.md`
  - `/feed.html` shows all appearances for the logged in user's followed, reverse chronologically
- `/sql/{query}` - perform read-only query against DB
- `/mcp` - use `/sql` and `/feed` over mcp
- Login with X

Out of scope:

- Purchase $20/month
- Email Digests
- Instant Emails
- Transcripts or full statement database
- NER
- Requesting adding new people

Pricing (out of scope):

- Free: all public websites, feed to follow up to 10 people
- $20/month plan to have unlimited access to MCP and limited SQL queries
- $2000/month for full data access and custom needs

Context:

- Tasks with webhooks: https://docs.parallel.ai/api-reference/task-api-v1/create-task-run https://docs.parallel.ai/task-api/features/webhooks
- Full-stack Cloudflare app with DO-based Storage: https://flaredream.com/system-ts.md with cronjobs
- Separate X OAuth with MCP-compliant Authorization Provider https://github.com/janwilmake/x-oauth-client-provider
- Authed Query API (with readonly validation for non-janwilmake users) https://uithub.com/janwilmake/queryable-object
- Authed MCP (fully spec-compliant)

First step: determine a task output format that allows gathering complete results.

Disclaimer: i'm collaborating with Parallel to explore the potential and share!

This morning I got to work! Learnings:

- The task interface from paralel itself gave me just a single appearance even though I specified i wanted an array.
- [the docs on processors](https://docs.parallel.ai/task-api/core-concepts/choose-a-processor) state you can just get up to 25 datapoints, so we need to be creative if we want complete results
- I built this [little tool](https://tasks.gptideas.com) to test with more freedom in the output schema than the interface has. This allows me to get arrays back!
- I decided to specify a task output schema myself and came up with [output1.json](experiments/output1.json). The problem is that this is already 7 datapoints. I will never be able to get all appearances in one task! Output Examples: [Geoffrey Hinton](https://tasks.gptideas.com/task/04ccdc68-8ba9-4934-897d-dc2569c18fd0), [Elon Musk](https://tasks.gptideas.com/task/4a309d5d-019c-4933-ac87-e0aba4364b29). This looks promising though.
- [output2.json](experiments/output2.json) has just 2 datapoints per appearance! So we can easily do up 10 appearances with the pro processor. Let's try it with [Elon in 2021](). Is this better?
- Some people have many more appearances than others, and this is hard to determine upfront for a given person. For example, Claude estimates Elon has up to [300 public appearances over his career](https://letmeprompt.com/rules-httpsuithu-s2wmeg0), while someone less famous (but still famous) like Pavel Durov likely has way less due to his preference of privacy.

Ultimately, I want this dataset to be fully complete:

```ts
type People = {
  name: string;
  appearances: {
    url: string;
    title: string;
    summary: string;
    date: string;
    type: string;
  }[];
};
```

Parallels deep research interface does a great job for Pavel Durov estimating the total amount of public appearances.

# Main question: Is a single deep research enough to get a historical overview of public appearances of an individual?

```
How many public appearances do you think Elon Musk has that are documented on the internet?
What counts:
- Formal events
- Podcasts, interviews
- Livestreams
- Blogposts
What does not count:
- Photos/videos from fans,paparazzi,events
- Social media posts (tweets, Facebook posts, etc)
- News written about this person by third parties

For each year in his lifetime, give me a summary of all appearances
```

After playing around with it a bit more, I found that it's very good with deep research. It seems crucial though to first get a high level grasp of the periods the person was active and what to search for, just like a normal human would do it. It's not always evident from the title that the person was in it, so we need to first do a high level overview of periods and potential searches that may yield results. With that, we get a better shot of getting an as complete historical list of appearances as possible.

What about [this](search-task.md) with [this output schema](search-task.schema.json)?

I tried this but unfortunately, I ran into an error after it timed out after 1 hour. I also got this warning: `"This task may be too complex for ultra8x processor. Consider using https://platform.parallel.ai to optimize your task schema."`. I also tried it on the platform and with deep research (with an 'auto' schema) it does return a JSON and report, but unfortunately, that's not the structure I can build an interface on.

Since deep research with large processors take quite some time and have a chance to fail, I found it quite difficult to find a good task that works with structured output that includes all historical public appearances. It's a lot of manual iterative work, so I hope I can find ways to make this more systematic for future new projects. How can we minimize research time of finding the right parameters for a given objective?

As a last resort, I am considering to perform an extra step to convert to my desired structured JSON based off the parallel markdown report (or based off the auto JSON); this seems to work really well! https://letmeprompt.com/httpspastebincon-ydkngl0. I saw there's a lot of URLs that weren't correct in this result, so decided to add one line to link to google if the URL is not there or low confidence: https://letmeprompt.com/rules-httpsuithu-qf1xsx0

After seeing that even a simplified search-task schema didn't work, I am now trying to simplify the task.

After seeing that even a much simpler search task didn't work, and also finding that the URLs aren't reliable, especially for older appearances, I'm now considering to just go with appearances between a date range (after 2024-01-01) because this will be a much smaller dataset and hopefully, the agent won't time out.

I found that ultra8x tasks generally take longer to complete than ultra tasks, even though this isn't mentioned in the docs. While my ultra8x tasks almost always time out for my particular usecase, ultra will work more often; ultra2x also works sometimes but is really close to the upper bound of 3600 seconds (>50 minutes)

Finally! I got it to work on the `ultra` processor on a smaller task (only looking for appearances after a january 1st, 2024). The final task that succeeds is:

```
Which public appearances of {{name}} can you find between 2024-01-01 and today

What counts:

- Formal events
- Podcasts, interviews
- Livestreams
- Authored blogposts or written interviews/Q&As

What does not count:

- Photos/videos from fans,paparazzi
- Social media posts (Tweets, Facebook posts, etc)
- News written about this person by third parties

Provide a full list of appearances.
```

What I observed, is that:

- You need to scope your task small enough, especially when you have a fixed output JSON schema. It seems auto schema (deep research) outputs can be much larger
- For people that have lots of public appearances (or blogposts), it's still missing a few here and there.
- Costs can add up quickly when doing such batch tasks (I have 160+ people the dataset now) so it's best do do most of your experiementation manually and gradually or with a small test set.
- It can take long iterating on this because tasks can be slow. Have something else to do in between iterations. If you have the capacity, test multiple things at once (but don't loose track)
- some tasks can time out (after 1 hour), so be sure not to make the scope of a task too large, there's limited amount of things an agent can do in 1 hour

Ultimately, I think it's a very powerful and simple API that can basically extract any public web data in a much easier way than old-fashioned webscraping. It definitley still has some rough edges but I know the team is working very hard on this, and looking at where they're going I'm excited for all the new potential applications this unlocks.

For now, I just did a sinlge scraping run which I can manually redo to only scrape appearances between 2024-01-01 and now. Rerunning takes up to 1 hour and I can just do it with my secret at `GET /seed`

However, when I iterate on this, the next steps will be

- verifying even better that the scraped data is of high confidence and all urls are the best possible ones, valid and working
- doing a frequent scheduled task for each person (e.g. daily) to get all NEW things, without having to re-scrape all older material that I already have
- Personalization/Monetization: Add login and subscription element and ability to follow
- Analytics: Simple Analytics

PS. I vibe-coded the entire following system, user login, and the entire frontend, btw. [I have a great system prompt and use vanilla HTML on Cloudflare workers](https://flaredream.com/system-ts.md)
