Goal: to build a database of public appearances of high-profile people.

SPEC:

- A good task to get historical data (longer period) for a person that is sufficiently reliable. Maybe a single task is enough
- A daily cronjob that queues 1/7th of people in the batch API for the last 7 days
- Storage: unique Durable object
  - Tasks table
  - Appearances table
  - Users table with `followers: {name:string,notify:"weekly"|"instant"}[]`
- `index.html`:
  - Sell the UVP
  - Login/logout with X account
  - List all available people with easy way to view all appearances, and toggle follow
  - Link to go to feed
- `list.html`
  - KV: `/{name-slug}.html` and `/{name-slug}.md`
  - `/feed.html` shows all appearances for the logged in user's followed, reverse chronologically
- `/sql/{query}` - perform read-only query against DB
- `/mcp` - use `/sql` and `/feed` over mcp
- Login with X
- Purchase $20/month

Out of scope:

- Email Digests

Pricing:

- free: all public websites, feed to follow up to 10 people
- $20/month plan to have unlimited access to MCP and limited SQL queries
- $2000/month for full data access and custom needs
