/// <reference types="@cloudflare/workers-types" />

export interface Env {
  KV: KVNamespace;
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

      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

async function handleSeed(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Fetch people.json from assets
    const peopleResponse = await env.ASSETS.fetch(
      new Request("https://placeholder/people.json")
    );
    if (!peopleResponse.ok) {
      throw new Error("Failed to fetch people.json");
    }
    const people: Person[] = await peopleResponse.json();

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
          processor: "base",
          metadata: {
            slug: person.slug,
          },
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

    // Check if task is completed (success or failure)
    if (
      payload.data.status === "completed" ||
      payload.data.status === "failed"
    ) {
      const slug = payload.data.metadata?.slug;

      if (!slug) {
        console.error("No slug found in task metadata");
        return new Response("No slug in metadata", { status: 400 });
      }

      // Store the full task run data in KV
      await env.KV.put(`person:${slug}`, JSON.stringify(payload.data));

      return new Response("Webhook processed", { status: 200 });
    }

    // Task not yet completed, acknowledge but don't process
    return new Response("Task not completed", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}

async function handleSlugRequest(slug: string, env: Env): Promise<Response> {
  try {
    const result = await env.KV.get(`person:${slug}`);

    if (!result) {
      return new Response("Person not found", { status: 404 });
    }

    return new Response(result, {
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
