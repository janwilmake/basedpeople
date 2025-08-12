Goal: to build a database of public appearances of high-profile people.

SPEC:

- A good task to get historical data (longer period) for a person that is sufficiently reliable. Maybe a single task is enough
- A daily cronjob that queues 1/7th of people in the batch API for the last 7 days
- Storage: unique DO
  - Tasks table
  - Appearances table
  - Users table with `followers: {name:string,notify:"weekly"|"instant"}[]`
- KV: `/{name-slug}.html` and `/{name-slug}.md`
- APIs: `/mcp`, `/sql`
- `/feed` with logged in user's followers
- Homepage: list people with easy way to follow
- Login with X, fill in email to receive weekly following email
- Purchase $20/month for instant emails
