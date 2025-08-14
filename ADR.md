Ok so recently I discovered Parallel and I have had this idea for a long time... What if you could follow people across the entire internet? Famous people usually have lots of different places in the world where they appear and the online documentation of that is usually scattered across many places. But I want a way to follow specific people in a single place. Following them on their respective social media platforms isn't enough, it's too scatered and incomplete because they don't post about everything.

Parallel seems like a great way to try and gather this type of data!

First step: determine a task output format that allows gathering complete results.

Learnings:

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

Main question: Is a single deep research enough to get a historical overview of public appearances of an individual?

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
