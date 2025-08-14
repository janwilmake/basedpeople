---
title: Show HN: I built a way to track public appearances of anyone across the web
---

Hey HN! I've always been frustrated by having to follow people across 10 different platforms just to catch what they actually say. Lately I've quit following other media entirely and am just hanging out on twitter, but the amount of things I'm missing is vast, I'm sure.

Recently I started playing with this new API from Parallel AI that let's you do super deep web research and collect tons of datapoints at once. Today I tried to solve my own problem and built Based People (https://basedpeople.com) using the Task API.

**Features:**

- Finds and tracks public appearances – podcasts, conferences, congressional hearings, interviews, fireside chats, and blogs for 160+ influcential tech people
- allows you to follow any of them and build a public appearances feed for yourself

**The challenges were real:**

- Need to know the limitations of the task api, or it will timeout after 1 hour which is annoying
- Spent about $200 but I could've prevented that by staying with the test-dataset longer, I rushed it a bit at the end.
- Iterating on prompts to get reliable structured data took me the entire day
- Some URLs come back broken, especially for older content

**Current limitations:**

- Only covers 2024-present (historical data was too much for the AI)
- Does not refresh automatically yet, will need a daily or weekly update with a cronjob

The potential though – imagine following anyone across their entire digital footprint. Journalists, politicians, researchers. This could work for any public figure once the tooling gets better.

Right now it's free to use, no signup required to browse. It's also open source if you're curious. Would love your feedback on the concept and execution!
