/// <reference types="@cloudflare/workers-types" />

interface Person {
  name: string;
  slug: string;
  summary: string;
  category: string;
}

interface Appearance {
  url: string;
  period?: string;
  type: string;
  keywords?: string[];
  date: string;
  title: string;
}

interface TaskResult {
  run: {
    run_id: string;
    status: string;
    is_active: boolean;
    processor: string;
    metadata?: Record<string, any>;
    created_at: string;
    modified_at: string;
  };
  output: {
    basis: Array<{
      field: string;
      citations: Array<{
        title?: string | null;
        url: string;
        excerpts?: string[] | null;
      }>;
      reasoning: string;
      confidence?: string | null;
    }>;
    type: "json";
    content: {
      name: string;
      lifePeriods: string;
      searchStrategy: string;
      appearances: Appearance[];
    };
  };
}

export interface Env {
  ASSETS: Fetcher;
  KV: KVNamespace;
}

export async function personHtmlHandler(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathMatch = url.pathname.match(/^\/([^\/]+)\.html$/);

    if (!pathMatch) {
      return new Response("Not Found", { status: 404 });
    }

    const slug = pathMatch[1];

    // Fetch people data
    const peopleResponse = await env.ASSETS.fetch(
      new Request(`${url.origin}/people.json`)
    );
    if (!peopleResponse.ok) {
      throw new Error("Failed to fetch people data");
    }
    const people: Person[] = await peopleResponse.json();

    // Find the person
    const person = people.find((p) => p.slug === slug);
    if (!person) {
      return new Response("Person Not Found", { status: 404 });
    }

    // Get appearance data from KV or fallback to dummy
    let taskResult: TaskResult;
    const kvData = await env.KV.get(`person:${slug}`, { type: "json" });

    if (kvData) {
      taskResult = kvData as TaskResult;
    } else {
      // Fallback to dummy data
      const dummyResponse = await env.ASSETS.fetch(
        new Request(`${url.origin}/dummy.json`)
      );
      if (!dummyResponse.ok) {
        throw new Error("Failed to fetch dummy data");
      }
      taskResult = await dummyResponse.json();
    }

    const appearances = taskResult.output.content.appearances || [];
    const lifePeriods = taskResult.output.content.lifePeriods || "";
    const searchStrategy = taskResult.output.content.searchStrategy || "";

    // Group appearances by type
    const groupedAppearances = appearances.reduce((acc, appearance) => {
      if (!acc[appearance.type]) {
        acc[appearance.type] = [];
      }
      acc[appearance.type].push(appearance);
      return acc;
    }, {} as Record<string, Appearance[]>);

    // Sort appearances by date (newest first)
    Object.keys(groupedAppearances).forEach((type) => {
      groupedAppearances[type].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${person.name} - Appearances | Based People</title>
    
    <meta name="description" content="All appearances and quotes from ${
      person.name
    }. Never miss what ${person.name} actually says." />
    <meta name="robots" content="index, follow" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="${
      person.name
    } - Appearances | Based People" />
    <meta property="og:description" content="All appearances and quotes from ${
      person.name
    }. Never miss what ${person.name} actually says." />
    <meta property="og:type" content="profile" />
    <meta property="og:url" content="${url.origin}/${slug}.html" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${
      person.name
    } - Appearances | Based People" />
    <meta name="twitter:description" content="All appearances and quotes from ${
      person.name
    }. Never miss what ${person.name} actually says." />
    
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
            overflow-x: hidden;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .header {
            padding: 40px 0;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a4d3a 100%);
            position: relative;
        }

        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 70% 30%, rgba(34, 197, 94, 0.1) 0%, transparent 50%);
        }

        .header-content {
            position: relative;
            z-index: 2;
        }

        .back-link {
            color: #22c55e;
            text-decoration: none;
            font-size: 0.9rem;
            margin-bottom: 20px;
            display: inline-block;
            transition: color 0.3s ease;
        }

        .back-link:hover {
            color: #16a34a;
        }

        .person-title {
            font-size: clamp(2.5rem, 6vw, 4rem);
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #ffffff 0%, #22c55e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .person-category {
            color: #22c55e;
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
        }

        .person-summary {
            color: #d0d0d0;
            font-size: 1.1rem;
            max-width: 800px;
            margin-bottom: 2rem;
        }

        .stats {
            display: flex;
            gap: 40px;
            flex-wrap: wrap;
        }

        .stat {
            text-align: center;
        }

        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: #22c55e;
            display: block;
        }

        .stat-label {
            color: #a0a0a0;
            font-size: 0.9rem;
        }

        .main-content {
            padding: 80px 0;
            background: #0a0a0a;
        }

        .section {
            margin-bottom: 60px;
        }

        .section-title {
            font-size: 2rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 2rem;
            position: relative;
            padding-left: 20px;
        }

        .section-title::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 30px;
            background: #22c55e;
            border-radius: 2px;
        }

        .appearances-grid {
            display: grid;
            gap: 30px;
        }

        .appearance-type {
            background: linear-gradient(135deg, #1a1a1a 0%, #0f2a1f 100%);
            border: 1px solid #22c55e20;
            border-radius: 12px;
            padding: 30px;
        }

        .appearance-type-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #22c55e;
            margin-bottom: 20px;
            text-transform: capitalize;
        }

        .appearance-list {
            display: grid;
            gap: 20px;
        }

        .appearance-item {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s ease;
        }

        .appearance-item:hover {
            border-color: #22c55e;
            background: #1f1f1f;
            transform: translateY(-2px);
        }

        .appearance-header {
            display: flex;
            justify-content: between;
            align-items: flex-start;
            gap: 15px;
            margin-bottom: 10px;
        }

        .appearance-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #ffffff;
            flex-grow: 1;
        }

        .appearance-date {
            color: #22c55e;
            font-size: 0.9rem;
            font-weight: 500;
            white-space: nowrap;
        }

        .appearance-meta {
            display: flex;
            gap: 15px;
            align-items: center;
            margin-bottom: 15px;
        }

        .appearance-period {
            color: #a0a0a0;
            font-size: 0.9rem;
        }

        .appearance-keywords {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .keyword {
            background: #22c55e20;
            color: #22c55e;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .appearance-link {
            display: inline-block;
            color: #22c55e;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
            transition: color 0.3s ease;
        }

        .appearance-link:hover {
            color: #16a34a;
        }

        .info-section {
            background: linear-gradient(135deg, #1a1a1a 0%, #0f2a1f 100%);
            border: 1px solid #22c55e20;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 40px;
        }

        .info-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #22c55e;
            margin-bottom: 15px;
        }

        .info-text {
            color: #d0d0d0;
            line-height: 1.7;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }

        .empty-state h3 {
            font-size: 1.5rem;
            margin-bottom: 10px;
            color: #888;
        }

        @media (max-width: 768px) {
            .stats {
                justify-content: center;
            }

            .appearance-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .appearance-meta {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="header-content">
                <a href="/" class="back-link">← Back to Based People</a>
                <h1 class="person-title">${person.name}</h1>
                <div class="person-category">${person.category}</div>
                <p class="person-summary">${person.summary}</p>
                <div class="stats">
                    <div class="stat">
                        <span class="stat-number">${appearances.length}</span>
                        <span class="stat-label">Total Appearances</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${
                          Object.keys(groupedAppearances).length
                        }</span>
                        <span class="stat-label">Media Types</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${
                          appearances.length > 0
                            ? new Date(
                                Math.max(
                                  ...appearances.map((a) =>
                                    new Date(a.date).getTime()
                                  )
                                )
                              ).getFullYear()
                            : "N/A"
                        }</span>
                        <span class="stat-label">Latest Year</span>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            ${
              lifePeriods
                ? `
            <div class="section">
                <div class="info-section">
                    <h2 class="info-title">Life Periods</h2>
                    <p class="info-text">${lifePeriods}</p>
                </div>
            </div>
            `
                : ""
            }

            ${
              searchStrategy
                ? `
            <div class="section">
                <div class="info-section">
                    <h2 class="info-title">Search Strategy</h2>
                    <p class="info-text">${searchStrategy}</p>
                </div>
            </div>
            `
                : ""
            }

            <div class="section">
                <h2 class="section-title">Appearances</h2>
                ${
                  Object.keys(groupedAppearances).length > 0
                    ? `
                <div class="appearances-grid">
                    ${Object.entries(groupedAppearances)
                      .map(
                        ([type, typeAppearances]) => `
                    <div class="appearance-type">
                        <h3 class="appearance-type-title">${type} (${
                          typeAppearances.length
                        })</h3>
                        <div class="appearance-list">
                            ${typeAppearances
                              .map(
                                (appearance) => `
                            <div class="appearance-item">
                                <div class="appearance-header">
                                    <div class="appearance-title">${
                                      appearance.title
                                    }</div>
                                    <div class="appearance-date">${new Date(
                                      appearance.date
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}</div>
                                </div>
                                <div class="appearance-meta">
                                    ${
                                      appearance.period
                                        ? `<div class="appearance-period">Period: ${appearance.period}</div>`
                                        : ""
                                    }
                                    ${
                                      appearance.keywords &&
                                      appearance.keywords.length > 0
                                        ? `
                                    <div class="appearance-keywords">
                                        ${appearance.keywords
                                          .map(
                                            (keyword) =>
                                              `<span class="keyword">${keyword}</span>`
                                          )
                                          .join("")}
                                    </div>
                                    `
                                        : ""
                                    }
                                </div>
                                <a href="${
                                  appearance.url
                                }" target="_blank" rel="noopener noreferrer" class="appearance-link">
                                    View Source →
                                </a>
                            </div>
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                    `
                      )
                      .join("")}
                </div>
                `
                    : `
                <div class="empty-state">
                    <h3>No appearances found</h3>
                    <p>We're still gathering appearance data for ${person.name}.</p>
                </div>
                `
                }
            </div>
        </div>
    </main>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error in personHtmlHandler:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
