/// <reference types="@cloudflare/workers-types" />
/// <reference lib="esnext" />

import { DurableObject } from "cloudflare:workers";
import { personHtmlHandler } from "./personHandler";

// replace with prod version (people.json) after task seems good
const PEOPLE_FILE = "people.json";

export interface Env {
  APPEARANCES: DurableObjectNamespace<AppearancesDB>;
  ASSETS: Fetcher;
  PARALLEL_API_KEY: string;
  CRON_SECRET: string;
  WEBHOOK_SECRET: string;
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

      // Handle /{slug}.json requests
      const slugMatch = url.pathname.match(/^\/([^\/]+)\.json$/);
      if (slugMatch && request.method === "GET") {
        return handleSlugRequest(slugMatch[1], env);
      }

      const slugMatchHtml = url.pathname.match(/^\/([^\/]+)\.html$/);
      if (slugMatchHtml && request.method === "GET") {
        return personHtmlHandler(request, env);
      }

      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_type (type),
        INDEX idx_date (date),
        INDEX idx_status (status)
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

      // Insert new appearances
      const stmt = this.sql.exec(`
        INSERT INTO appearances (slug, name, url, title, type, date, period, keywords, status, run_id, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

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
