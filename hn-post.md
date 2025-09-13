---
title: Show HN: I built a directory of public appearances of tech people across the web
url: https://basedpeople.com
---

Hey HN! I've always been frustrated by having to follow people across 10 different platforms just to catch what they actually say. Lately I've quit following other media entirely and am just hanging out on twitter, but the amount of things I'm missing is vast, I'm sure.

Recently I started playing with this new API from Parallel AI that let's you do super deep web research and collect tons of datapoints at once. Today I tried to solve my own problem and built Based People using the Task API.

**Features:**

- Finds and tracks public appearances – podcasts, conferences, congressional hearings, interviews, fireside chats, and blogs for 160+ influcential tech people
- allows you to follow any of them and build a public appearances feed for yourself

It took me a little trial and error and I spent over $200 (should've tested with small test-set longer), but overall I am really impressed how far webscraping has come (they beat GPT5 in their own benchmark). Repo is linked from the footer for more details.

**Current limitations:**

- Only covers 2024-present (historical data was too much for the AI)
- Does not refresh automatically yet, will need a daily or weekly update with a cronjob

The potential though – imagine following anyone across their entire digital footprint. Journalists, politicians, researchers. This could work for any public figure!

Right now it's free to use, no signup required to browse. It's also open source if you're curious. Next steps are verifying/improving data quality and deepening the dataset.

Would love your feedback on the concept and execution!
