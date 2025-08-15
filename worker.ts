/// <reference types="@cloudflare/workers-types" />
/// <reference lib="esnext" />

import { DurableObject } from "cloudflare:workers";
import { personHtmlHandler } from "./personHandler";
import {
  UserDO,
  handleOAuth,
  getAccessToken,
  XUser,
} from "x-oauth-client-provider";

// Export the UserDO for OAuth
export { UserDO };

// replace with prod version (people.json) after task seems good
const PEOPLE_FILE = "people.json";

export interface Env {
  APPEARANCES: DurableObjectNamespace<AppearancesDB>;
  UserDO: DurableObjectNamespace<UserDO>;
  ASSETS: Fetcher;
  PARALLEL_API_KEY: string;
  CRON_SECRET: string;
  WEBHOOK_SECRET: string;
  X_CLIENT_ID: string;
  X_CLIENT_SECRET: string;
}

interface Person {
  name: string;
  slug: string;
}

interface TaskRunResponse {
  run_id: string;
  status: string;
  is_active: boolean;
}

interface WebhookPayload {
  timestamp: string;
  type: string;
  data: {
    run_id: string;
    status: string;
    is_active: boolean;
    metadata?: Record<string, string>;
    [key: string]: any;
  };
}

interface Appearance {
  url: string;
  period?: string;
  type: string;
  keywords: string[];
  date: string;
  title: string;
}

interface PersonData {
  name: string;
  appearances: Appearance[];
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle OAuth routes first
    const oauthResponse = await handleOAuth(request, env);
    if (oauthResponse) return oauthResponse;

    // Ensure required environment variables are present
    if (!env.PARALLEL_API_KEY) {
      return new Response("Missing PARALLEL_API_KEY", { status: 500 });
    }
    if (!env.CRON_SECRET) {
      return new Response("Missing CRON_SECRET", { status: 500 });
    }
    if (!env.WEBHOOK_SECRET) {
      return new Response("Missing WEBHOOK_SECRET", { status: 500 });
    }

    try {
      if (url.pathname === "/seed" && request.method === "GET") {
        return handleSeed(request, env);
      }

      if (url.pathname === "/webhook" && request.method === "POST") {
        return handleWebhook(request, env);
      }

      // Handle POST /toggle/{slug}
      const toggleMatch = url.pathname.match(/^\/toggle\/([^\/]+)$/);
      if (toggleMatch) {
        return handleToggleFollow(toggleMatch[1], request, env);
      }
      if (url.pathname === "/follows" && request.method === "GET") {
        return handleGetFollows(request, env);
      }

      // Handle /feed
      if (url.pathname === "/feed" && request.method === "GET") {
        return handleFeed(request, env);
      }

      // Handle /{slug}.json requests
      const slugMatch = url.pathname.match(/^\/([^\/]+)\.json$/);
      if (slugMatch && request.method === "GET") {
        return handleSlugRequest(slugMatch[1], env);
      }

      const slugMatchHtml = url.pathname.match(/^\/([^\/]+)\.html$/);
      if (slugMatchHtml && request.method === "GET") {
        return personHtmlHandler(request, env);
      }

      // Handle root route
      if (url.pathname === "/" && request.method === "GET") {
        return handleIndexPage(request, env);
      }

      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

async function handleGetFollows(request: Request, env: Env): Promise<Response> {
  // Get user from access token
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return new Response(JSON.stringify({ follows: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get user data from UserDO
    const userDOId = env.UserDO.idFromName(`user:${accessToken}`);
    const userDO = env.UserDO.get(userDOId);
    const userData = await userDO.getUser();

    if (!userData) {
      return new Response(JSON.stringify({ follows: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use the user's X ID as user_id
    const userId = userData.user.id;

    // Get the Durable Object instance
    const dbId = env.APPEARANCES.idFromName("main");
    const db = env.APPEARANCES.get(dbId);

    const followedSlugs = await db.getFollowedSlugs(userId);

    // Convert to the format expected by frontend (with name)
    // We need to get people.json to map slugs to names
    const peopleResponse = await env.ASSETS.fetch(
      new Request("https://placeholder/" + PEOPLE_FILE)
    );

    let peopleMap = new Map();
    if (peopleResponse.ok) {
      const people = await peopleResponse.json<Person[]>();
      people.forEach((person) => {
        peopleMap.set(person.slug, person.name);
      });
    }

    const follows = followedSlugs.map((slug) => ({
      slug,
      name: peopleMap.get(slug) || slug, // fallback to slug if name not found
    }));

    return new Response(JSON.stringify({ follows }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60", // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error("Error in handleGetFollows:", error);
    return new Response(JSON.stringify({ follows: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Durable Object for managing appearances data
export class AppearancesDB extends DurableObject<Env> {
  private sql: SqlStorage;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.sql = state.storage.sql;
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Create appearances table if it doesn't exist
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS appearances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        period TEXT,
        keywords TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        run_id TEXT,
        last_updated TEXT NOT NULL,
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create follows table
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        slug TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, slug)
      )
    `);
  }

  async storePersonResult(
    slug: string,
    name: string,
    result: any,
    runId: string,
    status: string = "completed",
    error?: string
  ) {
    if (status === "completed" && result.appearances) {
      // Clear existing appearances for this person
      this.sql.exec("DELETE FROM appearances WHERE slug = ?", slug);

      for (const appearance of result.appearances) {
        this.sql.exec(
          `
          INSERT INTO appearances (slug, name, url, title, type, date, period, keywords, status, run_id, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          slug,
          name,
          appearance.url,
          appearance.title,
          appearance.type,
          appearance.date,
          appearance.period || null,
          JSON.stringify(appearance.keywords),
          status,
          runId,
          new Date().toISOString()
        );
      }
    } else {
      // Store error or failed status
      this.sql.exec(
        `
        INSERT OR REPLACE INTO appearances (slug, name, url, title, type, date, keywords, status, run_id, last_updated, error)
        VALUES (?, ?, '', '', 'error', ?, '[]', ?, ?, ?, ?)
      `,
        slug,
        name,
        new Date().toISOString(),
        status,
        runId,
        new Date().toISOString(),
        error || null
      );
    }

    return { success: true };
  }

  async getPersonData(slug: string): Promise<PersonData | null> {
    const results = this.sql
      .exec(
        "SELECT * FROM appearances WHERE slug = ? AND status = 'completed' ORDER BY date DESC",
        slug
      )
      .toArray();

    if (results.length === 0) {
      return null;
    }

    const appearances = results.map((row) => ({
      url: row.url as string,
      title: row.title as string,
      type: row.type as string,
      date: row.date as string,
      period: row.period as string | undefined,
      keywords: JSON.parse(row.keywords as string) as string[],
    }));

    return {
      name: results[0].name as string,
      appearances,
    };
  }

  async getPersonStatus(slug: string) {
    const result = this.sql
      .exec(
        "SELECT status, run_id, last_updated, error FROM appearances WHERE slug = ? ORDER BY last_updated DESC LIMIT 1",
        slug
      )
      .toArray();

    if (result.length === 0) {
      return null;
    }

    return {
      status: result[0].status,
      run_id: result[0].run_id,
      lastUpdated: result[0].last_updated,
      error: result[0].error,
    };
  }

  async getAllAppearances(limit = 1000, offset = 0) {
    return this.sql
      .exec(
        "SELECT * FROM appearances WHERE status = 'completed' ORDER BY date DESC LIMIT ? OFFSET ?",
        limit,
        offset
      )
      .toArray();
  }

  async searchAppearances(
    query: {
      slug?: string;
      type?: string;
      keywords?: string[];
      dateFrom?: string;
      dateTo?: string;
    },
    limit = 100
  ) {
    let sql = "SELECT * FROM appearances WHERE status = 'completed'";
    const params: any[] = [];

    if (query.slug) {
      sql += " AND slug = ?";
      params.push(query.slug);
    }

    if (query.type) {
      sql += " AND type = ?";
      params.push(query.type);
    }

    if (query.keywords && query.keywords.length > 0) {
      const keywordConditions = query.keywords
        .map(() => "keywords LIKE ?")
        .join(" AND ");
      sql += ` AND (${keywordConditions})`;
      query.keywords.forEach((keyword) => params.push(`%"${keyword}"%`));
    }

    if (query.dateFrom) {
      sql += " AND date >= ?";
      params.push(query.dateFrom);
    }

    if (query.dateTo) {
      sql += " AND date <= ?";
      params.push(query.dateTo);
    }

    sql += " ORDER BY date DESC LIMIT ?";
    params.push(limit);

    return this.sql.exec(sql, ...params).toArray();
  }

  async toggleFollow(
    userId: string,
    slug: string
  ): Promise<{ following: boolean }> {
    // Check if already following
    const existing = this.sql
      .exec(
        "SELECT id FROM follows WHERE user_id = ? AND slug = ?",
        userId,
        slug
      )
      .toArray();

    if (existing.length > 0) {
      // Unfollow
      this.sql.exec(
        "DELETE FROM follows WHERE user_id = ? AND slug = ?",
        userId,
        slug
      );
      return { following: false };
    } else {
      // Follow
      this.sql.exec(
        "INSERT INTO follows (user_id, slug) VALUES (?, ?)",
        userId,
        slug
      );
      return { following: true };
    }
  }

  async getFollowedSlugs(userId: string): Promise<string[]> {
    const results = this.sql
      .exec("SELECT slug FROM follows WHERE user_id = ?", userId)
      .toArray();
    return results.map((row) => row.slug as string);
  }

  async getFeedAppearances(userId: string, limit = 50): Promise<any[]> {
    // Get all followed slugs
    const followedSlugs = await this.getFollowedSlugs(userId);

    if (followedSlugs.length === 0) {
      return [];
    }

    // Create placeholders for IN clause
    const placeholders = followedSlugs.map(() => "?").join(",");

    // Get appearances for followed people, ordered by date desc
    const results = this.sql
      .exec(
        `SELECT * FROM appearances 
       WHERE slug IN (${placeholders}) AND status = 'completed' 
       ORDER BY date DESC 
       LIMIT ?`,
        ...followedSlugs,
        limit
      )
      .toArray();

    return results.map((row) => ({
      slug: row.slug as string,
      name: row.name as string,
      url: row.url as string,
      title: row.title as string,
      type: row.type as string,
      date: row.date as string,
      period: row.period as string | undefined,
      keywords: JSON.parse(row.keywords as string) as string[],
    }));
  }
}

async function handleToggleFollow(
  slug: string,
  request: Request,
  env: Env
): Promise<Response> {
  // Get user from access token
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    // Check if this is a browser request vs API request
    const acceptHeader = request.headers.get("accept") || "";
    const isBrowser = !acceptHeader.includes("application/json");

    if (isBrowser || acceptHeader.includes("text/html")) {
      // Redirect to login for browser requests
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/authorize?redirect_to=${encodeURIComponent(request.url)}`,
        },
      });
    } else {
      // Return JSON error with redirect info for API requests
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          redirect: `/authorize?redirect_to=${encodeURIComponent(request.url)}`,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  try {
    // Get user data from UserDO
    const userDOId = env.UserDO.idFromName(`user:${accessToken}`);
    const userDO = env.UserDO.get(userDOId);
    const userData = await userDO.getUser();

    if (!userData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use the user's X ID as user_id
    const userId = userData.user.id;

    // Get the Durable Object instance
    const dbId = env.APPEARANCES.idFromName("main");
    const db = env.APPEARANCES.get(dbId);

    const result = await db.toggleFollow(userId, slug);

    if (request.method === "GET") {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/`,
        },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in toggleFollow:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleIndexPage(request: Request, env: Env): Promise<Response> {
  try {
    // Serve the index.html file
    const indexResponse = await env.ASSETS.fetch(
      new Request("http://localhost/index.html")
    );

    if (!indexResponse.ok) {
      return new Response("Index page not found", { status: 404 });
    }

    // Get user info if logged in
    let user: XUser | null = null;
    let followedSlugs: string[] = [];

    const accessToken = getAccessToken(request);
    if (accessToken) {
      try {
        const userDOId = env.UserDO.idFromName(`user:${accessToken}`);
        const userDO = env.UserDO.get(userDOId);
        const userData = await userDO.getUser();

        if (userData) {
          user = userData.user;

          // Get followed slugs
          const dbId = env.APPEARANCES.idFromName("main");
          const db = env.APPEARANCES.get(dbId);
          followedSlugs = await db.getFollowedSlugs(user.id);
        }
      } catch (error) {
        console.error("Error getting user data:", error);
      }
    }

    let html = await indexResponse.text();

    // If user is logged in, update the follow buttons to show correct state
    if (user) {
      // Add JavaScript to initialize follow states
      const initScript = `
        <script>
          document.addEventListener('DOMContentLoaded', () => {
            const followedSlugs = ${JSON.stringify(followedSlugs)};
            document.querySelectorAll('.btn-follow').forEach(btn => {
              const slug = btn.dataset.slug;
              if (followedSlugs.includes(slug)) {
                btn.classList.add('following');
                btn.textContent = 'Following';
              }
            });
          });
        </script>
      `;
      html = html.replace("</body>", `${initScript}</body>`);
    }

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": user ? "private, max-age=300" : "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving index page:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function handleFeed(request: Request, env: Env): Promise<Response> {
  // Get user from access token
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    // Redirect to login if browser, otherwise return 401
    const isBrowser = request.headers.get("accept")?.includes("text/html");
    if (isBrowser) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/authorize?redirect_to=${encodeURIComponent(request.url)}`,
        },
      });
    }
    return new Response("Authentication required", { status: 401 });
  }

  try {
    // Get user data from UserDO
    const userDOId = env.UserDO.idFromName(`user:${accessToken}`);
    const userDO = env.UserDO.get(userDOId);
    const userData = await userDO.getUser();

    if (!userData) {
      return new Response("Invalid token", { status: 401 });
    }

    const user = userData.user;
    const userId = user.id;

    // Get the Durable Object instance
    const dbId = env.APPEARANCES.idFromName("main");
    const db = env.APPEARANCES.get(dbId);

    // Get feed appearances
    const appearances = await db.getFeedAppearances(userId, 50);
    const followedSlugs = await db.getFollowedSlugs(userId);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Feed - Based People</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #0a0a0a;
            color: #ffffff;
            font-family: 'Space Grotesk', sans-serif;
            line-height: 1.6;
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        .header {
            margin-bottom: 40px;
            padding: 40px 0;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a4d3a 100%);
            position: relative;
            border-radius: 12px;
            border: 1px solid #22c55e20;
        }

        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 70% 30%, rgba(34, 197, 94, 0.1) 0%, transparent 50%);
            border-radius: 12px;
        }

        .header-content {
            position: relative;
            z-index: 2;
            padding: 0 40px;
        }

        .header-title {
            font-size: clamp(2rem, 5vw, 3.5rem);
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #ffffff 0%, #22c55e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .header-subtitle {
            color: #d0d0d0;
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 1rem;
        }

        .user-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid #22c55e;
        }

        .user-name {
            font-weight: 600;
            color: #22c55e;
        }

        .stats {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }

        .stat {
            padding: 8px 16px;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid #22c55e40;
            border-radius: 6px;
            color: #22c55e;
            font-weight: 600;
        }

        .nav-links {
            margin-bottom: 20px;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }

        .nav-link {
            color: #22c55e;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
        }

        .nav-link:hover {
            color: #16a34a;
        }

        .feed-container {
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid #333;
            overflow: hidden;
        }

        .feed-header {
            background: linear-gradient(135deg, #1f1f1f 0%, #0f2a1f 100%);
            padding: 20px;
            border-bottom: 1px solid #333;
        }

        .feed-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 0.5rem;
        }

        .feed-subtitle {
            color: #a0a0a0;
        }

        .appearance-item {
            padding: 20px;
            border-bottom: 1px solid #2a2a2a;
            transition: all 0.3s ease;
        }

        .appearance-item:last-child {
            border-bottom: none;
        }

        .appearance-item:hover {
            background: #202020;
        }

        .appearance-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
            gap: 15px;
        }

        .appearance-title {
            font-weight: 600;
            color: #ffffff;
            font-size: 1.1rem;
            flex: 1;
            text-decoration: none;
        }

        .appearance-title:hover {
            color: #22c55e;
        }

        .appearance-date {
            color: #22c55e;
            font-weight: 600;
            white-space: nowrap;
            font-size: 0.95rem;
        }

        .appearance-person {
            color: #22c55e;
            font-weight: 600;
            margin-bottom: 10px;
            font-size: 0.9rem;
        }

        .appearance-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
        }

        .appearance-type {
            padding: 4px 8px;
            background: #333;
            border: 1px solid #555;
            border-radius: 4px;
            color: #d0d0d0;
            font-size: 0.85rem;
            font-weight: 500;
        }

        .appearance-keywords {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .keyword {
            padding: 2px 6px;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid #22c55e40;
            border-radius: 3px;
            color: #22c55e;
            font-size: 0.8rem;
        }

        .empty-feed {
            padding: 60px 20px;
            text-align: center;
            color: #666;
        }

        .empty-feed h3 {
            color: #ffffff;
            margin-bottom: 1rem;
        }

        .empty-feed a {
            color: #22c55e;
            text-decoration: none;
        }

        .empty-feed a:hover {
            color: #16a34a;
        }

        @media (max-width: 768px) {
            .appearance-header {
                flex-direction: column;
                gap: 5px;
            }

            .appearance-date {
                align-self: flex-start;
            }

            .header-content {
                padding: 0 20px;
            }

            .stats {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="nav-links">
            <a href="/" class="nav-link">← Back to Home</a>
            <a href="/logout" class="nav-link">Logout</a>
        </div>
        
        <div class="header">
            <div class="header-content">
                <h1 class="header-title">Your Feed</h1>
                <p class="header-subtitle">Latest appearances from people you follow</p>
                
                <div class="user-info">
                    <img src="${
                      user.profile_image_url || "/default-avatar.png"
                    }" alt="Avatar" class="user-avatar">
                    <div>
                        <div class="user-name">${
                          user.name || user.username
                        }</div>
                        <div style="color: #a0a0a0;">@${user.username}</div>
                    </div>
                </div>
                
                <div class="stats">
                    <div class="stat">${followedSlugs.length} Following</div>
                    <div class="stat">${
                      appearances.length
                    } Recent Appearances</div>
                </div>
            </div>
        </div>

        <div class="feed-container">
            <div class="feed-header">
                <h2 class="feed-title">Latest Appearances</h2>
                <p class="feed-subtitle">Reverse chronological order from your followed people</p>
            </div>
            
            ${
              appearances.length === 0
                ? `
                <div class="empty-feed">
                    <h3>No appearances yet</h3>
                    <p>You're not following anyone yet, or the people you follow haven't had any appearances.</p>
                    <p><a href="/">Browse people to follow</a></p>
                </div>
            `
                : `
                ${appearances
                  .map(
                    (appearance) => `
                    <div class="appearance-item">
                        <div class="appearance-person">
                            <a href="/${
                              appearance.slug
                            }.html" style="color: #22c55e; text-decoration: none;">
                                ${appearance.name}
                            </a>
                        </div>
                        <div class="appearance-header">
                            <a href="${
                              appearance.url
                            }" target="_blank" class="appearance-title">
                                ${appearance.title}
                            </a>
                            <div class="appearance-date">
                                ${new Date(appearance.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                            </div>
                        </div>
                        <div class="appearance-meta">
                            <div class="appearance-type">${
                              appearance.type
                            }</div>
                            <div class="appearance-keywords">
                                ${appearance.keywords
                                  .map(
                                    (keyword) =>
                                      `<span class="keyword">${keyword}</span>`
                                  )
                                  .join("")}
                            </div>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            `
            }
        </div>
    </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=300", // Cache privately for 5 minutes
      },
    });
  } catch (error) {
    console.error("Error in handleFeed:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function handleSeed(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Fetch people.json from assets
    const peopleResponse = await env.ASSETS.fetch(
      new Request("https://placeholder/" + PEOPLE_FILE)
    );
    if (!peopleResponse.ok) {
      throw new Error("Failed to fetch people JSON");
    }
    const people = await peopleResponse.json<Person[]>();

    // Fetch search-task.md template
    const taskTemplateResponse = await env.ASSETS.fetch(
      new Request("https://placeholder/search-task.md")
    );
    if (!taskTemplateResponse.ok) {
      throw new Error("Failed to fetch search-task.md");
    }
    const taskTemplate = await taskTemplateResponse.text();

    // Fetch search-task.schema.json
    const schemaResponse = await env.ASSETS.fetch(
      new Request("https://placeholder/search-task.schema.json")
    );
    if (!schemaResponse.ok) {
      throw new Error("Failed to fetch search-task.schema.json");
    }
    const outputSchema = await schemaResponse.json();

    const results = [];

    for (const person of people) {
      try {
        // Replace {{name}} placeholder with actual name
        const taskInput = taskTemplate.replace(/\{\{name\}\}/g, person.name);

        // Create task run with webhook
        const taskPayload = {
          task_spec: {
            output_schema: {
              type: "json",
              json_schema: outputSchema,
            },
          },
          input: taskInput,
          processor: "ultra",
          metadata: { slug: person.slug, name: person.name },
          webhook: {
            url: "https://basedpeople.com/webhook",
            event_types: ["task_run.status"],
          },
        };

        const taskResponse = await fetch(
          "https://api.parallel.ai/v1/tasks/runs",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": env.PARALLEL_API_KEY,
              "parallel-beta": "webhook-2025-08-12",
            },
            body: JSON.stringify(taskPayload),
          }
        );

        if (!taskResponse.ok) {
          const errorText = await taskResponse.text();
          console.error(`Failed to create task for ${person.name}:`, errorText);
          results.push({
            person: person.name,
            slug: person.slug,
            success: false,
            error: `HTTP ${taskResponse.status}: ${errorText}`,
          });
          continue;
        }

        const taskResult: TaskRunResponse = await taskResponse.json();
        results.push({
          person: person.name,
          slug: person.slug,
          success: true,
          run_id: taskResult.run_id,
          status: taskResult.status,
        });
      } catch (error) {
        console.error(`Error processing ${person.name}:`, error);
        results.push({
          person: person.name,
          slug: person.slug,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  try {
    // Get webhook headers for signature verification
    const webhookId = request.headers.get("webhook-id");
    const webhookTimestamp = request.headers.get("webhook-timestamp");
    const webhookSignature = request.headers.get("webhook-signature");

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      return new Response("Missing webhook headers", { status: 400 });
    }

    const body = await request.text();

    // Verify webhook signature
    if (
      !(await verifyWebhookSignature(
        env.WEBHOOK_SECRET,
        webhookId,
        webhookTimestamp,
        body,
        webhookSignature
      ))
    ) {
      return new Response("Invalid signature", { status: 401 });
    }

    const payload: WebhookPayload = JSON.parse(body);

    // Only process task_run.status events
    if (payload.type !== "task_run.status") {
      return new Response("Event type not supported", { status: 200 });
    }

    const { data } = payload;
    const slug = data.metadata?.slug;
    const name = data.metadata?.name;

    if (!slug || !name) {
      console.error("No slug or name found in task metadata");
      return new Response("No slug or name in metadata", { status: 400 });
    }

    // Get the Durable Object instance
    const dbId = env.APPEARANCES.idFromName("main");
    const db = env.APPEARANCES.get(dbId);

    if (data.status === "completed") {
      // Get the full result from the API
      try {
        const resultResponse = await fetch(
          `https://api.parallel.ai/v1/tasks/runs/${data.run_id}/result`,
          {
            headers: {
              "x-api-key": env.PARALLEL_API_KEY,
            },
          }
        );

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          const result = resultData.output?.content || resultData;

          // Store the result in Durable Object
          await db.storePersonResult(
            slug,
            name,
            result,
            data.run_id,
            "completed"
          );
          console.log(`Successfully stored result for person: ${slug}`);
        } else {
          console.error(
            `Failed to fetch result for run ${data.run_id}:`,
            await resultResponse.text()
          );

          // Store failed fetch info
          await db.storePersonResult(
            slug,
            name,
            null,
            data.run_id,
            "fetch_failed",
            `Failed to fetch result: HTTP ${resultResponse.status}`
          );
        }
      } catch (error) {
        console.error(`Error fetching result for run ${data.run_id}:`, error);

        // Store error info
        await db.storePersonResult(
          slug,
          name,
          null,
          data.run_id,
          "fetch_error",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    } else if (data.status === "failed") {
      // Store failed task result
      await db.storePersonResult(
        slug,
        name,
        null,
        data.run_id,
        "failed",
        data.error?.message || "Task execution failed"
      );
      console.log(`Stored failed result for person: ${slug}`);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}

async function handleSlugRequest(slug: string, env: Env): Promise<Response> {
  try {
    // Get the Durable Object instance
    const dbId = env.APPEARANCES.idFromName("main");
    const db = env.APPEARANCES.get(dbId);

    const personData = await db.getPersonData(slug);

    if (!personData) {
      return new Response("Person not found", { status: 404 });
    }

    const result = {
      status: "completed",
      result: personData,
      lastUpdated: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Slug request error:", error);
    return new Response("Failed to retrieve data", { status: 500 });
  }
}

async function verifyWebhookSignature(
  secret: string,
  webhookId: string,
  webhookTimestamp: string,
  body: string,
  webhookSignature: string
): Promise<boolean> {
  const payload = `${webhookId}.${webhookTimestamp}.${body}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  const expectedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  );

  // Parse space-delimited signatures
  const signatures = webhookSignature.split(" ");

  for (const sig of signatures) {
    const [version, receivedSig] = sig.split(",", 2);
    if (version === "v1") {
      // Use timing-safe comparison
      if (receivedSig === expectedSignature) {
        return true;
      }
    }
  }

  return false;
}
