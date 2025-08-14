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

Pricing:

- Free: all public websites, feed to follow up to 10 people
- $20/month plan to have unlimited access to MCP and limited SQL queries
- $2000/month for full data access and custom needs

Context:

- Tasks with webhooks: https://docs.parallel.ai/api-reference/task-api-v1/create-task-run https://docs.parallel.ai/task-api/features/webhooks
- Full-stack Cloudflare app with DO-based Storage: https://flaredream.com/system-ts.md with cronjobs
- Separate X OAuth with MCP-compliant Authorization Provider https://github.com/janwilmake/x-oauth-client-provider
- Authed Query API (with readonly validation for non-janwilmake users) https://uithub.com/janwilmake/queryable-object
- Authed MCP (fully spec-compliant)

Target Technical Advances:

- No X OAuth Client secrets in this app, use centralized X OAuth provider (rename: Wilmake Systems)

Todo:

- 🟠 Step 1: Improve tasks with small dataset (±5 people) - (very famous and less famous person): historical and weekly. Vibe-test for errors and cost.
- Build dataset of hitoric appearances of 100 individuals
- **Validate Assumption: the data is high-quality enough, the cost per month is under $500 for the POC**
- Preliminary: Stripeflare now uses card-fingerprint as user-id; allow passing userID if we use another type of login. This will make stripeflare usable for this usecase.
- _Talk to people about the problem of noise and how they get to high-signal information. Pay to subscribe to set of people?_
- Step 2: If I'm happy with the data, put it on cronjob for whole list of people, create list and index html and md results.
- Personalization/Monetization: Add login and subscription element and ability to follow
- Analytics: Simple Analytics
