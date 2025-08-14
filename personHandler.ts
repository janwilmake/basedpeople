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
  keywords: string[];
  date: string;
  title: string;
}

interface PersonData {
  name: string;
  periods: Array<{
    slug: string;
    title: string;
    estimatedAppearanceCount: string;
    why: string;
  }>;
  searchStrategy: Array<{
    objective: string;
    keywords: string[];
    strategy: string;
  }>;
  appearances: Appearance[];
}

interface TaskRunResult {
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
        title?: string;
        url: string;
        excerpts?: string[];
      }>;
      reasoning: string;
      confidence?: string;
    }>;
    type: "json";
    content: PersonData;
  };
}

export async function personHtmlHandler(
  request: Request,
  env: { ASSETS: Fetcher; KV: KVNamespace }
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const slug = url.pathname.replace(".html", "").replace("/", "");

    if (!slug) {
      return new Response("Not found", { status: 404 });
    }

    // Fetch people.json
    const peopleResponse = await env.ASSETS.fetch(
      new Request("https://example.com/people.json")
    );
    if (!peopleResponse.ok) {
      return new Response("People data not found", { status: 404 });
    }

    const people: Person[] = await peopleResponse.json();
    const person = people.find((p) => p.slug === slug);

    if (!person) {
      return new Response("Person not found", { status: 404 });
    }

    // Fetch person data from KV
    const kvData = (await env.KV.get(
      `person:${slug}`,
      "json"
    )) as TaskRunResult | null;

    if (!kvData || !kvData.output || !kvData.output.content) {
      return new Response("Person data not found", { status: 404 });
    }

    const personData = kvData.output.content;

    // Sort appearances by date (most recent first)
    const sortedAppearances = personData.appearances.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Group appearances by period if periods exist
    const appearancesByPeriod = new Map<string, Appearance[]>();
    const appearancesWithoutPeriod: Appearance[] = [];

    sortedAppearances.forEach((appearance) => {
      if (appearance.period) {
        if (!appearancesByPeriod.has(appearance.period)) {
          appearancesByPeriod.set(appearance.period, []);
        }
        appearancesByPeriod.get(appearance.period)!.push(appearance);
      } else {
        appearancesWithoutPeriod.push(appearance);
      }
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${person.name} - Based People</title>
    <meta name="description" content="${person.summary}" />
    
    <!-- Facebook Meta Tags -->
    <meta property="og:url" content="https://basedpeople.com/${slug}.html" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${person.name} - Based People" />
    <meta property="og:description" content="${person.summary}" />
    
    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${person.name} - Based People" />
    <meta name="twitter:description" content="${person.summary}" />

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
            padding: 60px 0;
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
            display: inline-block;
            color: #22c55e;
            text-decoration: none;
            margin-bottom: 2rem;
            font-weight: 500;
            transition: color 0.3s ease;
        }

        .back-link:hover {
            color: #16a34a;
        }

        .person-name {
            font-size: clamp(2.5rem, 6vw, 4rem);
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #ffffff 0%, #22c55e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.02em;
        }

        .person-category {
            display: inline-block;
            padding: 8px 16px;
            background: linear-gradient(135deg, #22c55e20 0%, #16a34a20 100%);
            color: #22c55e;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            border: 1px solid #22c55e40;
        }

        .person-summary {
            font-size: 1.2rem;
            color: #d0d0d0;
            max-width: 800px;
            line-height: 1.8;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }

        .stat-item {
            background: linear-gradient(135deg, #1a1a1a 0%, #0f2a1f 100%);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #22c55e20;
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
            margin-top: 0.5rem;
        }

        .appearances {
            padding: 80px 0;
            background: #0a0a0a;
        }

        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 3rem;
            text-align: center;
        }

        .period-section {
            margin-bottom: 60px;
        }

        .period-title {
            font-size: 1.8rem;
            font-weight: 600;
            color: #22c55e;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #22c55e20;
        }

        .period-description {
            color: #c0c0c0;
            margin-bottom: 2rem;
            font-size: 1.1rem;
        }

        .appearances-grid {
            display: grid;
            gap: 20px;
        }

        .appearance-card {
            background: linear-gradient(135deg, #1a1a1a 0%, #0f2a1f 100%);
            border: 1px solid #22c55e20;
            border-radius: 12px;
            padding: 24px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .appearance-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 10% 20%, rgba(34, 197, 94, 0.03) 0%, transparent 50%);
        }

        .appearance-card:hover {
            border-color: #22c55e40;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(34, 197, 94, 0.1);
        }

        .appearance-content {
            position: relative;
            z-index: 2;
        }

        .appearance-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .appearance-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 0.5rem;
        }

        .appearance-title a {
            color: inherit;
            text-decoration: none;
            transition: color 0.3s ease;
        }

        .appearance-title a:hover {
            color: #22c55e;
        }

        .appearance-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
        }

        .appearance-date {
            color: #22c55e;
            font-weight: 500;
            font-size: 0.95rem;
        }

        .appearance-type {
            background: #333;
            color: #ffffff;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 500;
        }

        .keywords {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 1rem;
        }

        .keyword {
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 500;
            border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .no-appearances {
            text-align: center;
            padding: 60px 20px;
            color: #666;
            font-size: 1.1rem;
        }

        @media (max-width: 768px) {
            .appearance-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .appearance-meta {
                width: 100%;
            }

            .stats {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }

            .stat-number {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <section class="header">
        <div class="container">
            <div class="header-content">
                <a href="/" class="back-link">← Back to Based People</a>
                <h1 class="person-name">${person.name}</h1>
                <div class="person-category">${person.category}</div>
                <p class="person-summary">${person.summary}</p>
                
                <div class="stats">
                    <div class="stat-item">
                        <span class="stat-number">${
                          sortedAppearances.length
                        }</span>
                        <div class="stat-label">Total Appearances</div>
                    </div>
                    ${
                      personData.periods
                        ? `<div class="stat-item">
                        <span class="stat-number">${personData.periods.length}</span>
                        <div class="stat-label">Periods Tracked</div>
                    </div>`
                        : ""
                    }
                    <div class="stat-item">
                        <span class="stat-number">${
                          new Set(sortedAppearances.map((a) => a.type)).size
                        }</span>
                        <div class="stat-label">Appearance Types</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="appearances">
        <div class="container">
            <h2 class="section-title">Recent Appearances</h2>
            
            ${
              sortedAppearances.length === 0
                ? `
                <div class="no-appearances">
                    <p>No appearances found for ${person.name} yet.</p>
                </div>
            `
                : ""
            }

            ${
              personData.periods && personData.periods.length > 0
                ? personData.periods
                    .map((period) => {
                      const periodAppearances =
                        appearancesByPeriod.get(period.slug) || [];
                      if (periodAppearances.length === 0) return "";

                      return `
                        <div class="period-section">
                            <h3 class="period-title">${period.title}</h3>
                            <p class="period-description">${period.why}</p>
                            <div class="appearances-grid">
                                ${periodAppearances
                                  .map(
                                    (appearance) => `
                                    <div class="appearance-card">
                                        <div class="appearance-content">
                                            <div class="appearance-header">
                                                <div>
                                                    <h4 class="appearance-title">
                                                        <a href="${
                                                          appearance.url
                                                        }" target="_blank" rel="noopener noreferrer">
                                                            ${appearance.title}
                                                        </a>
                                                    </h4>
                                                </div>
                                                <div class="appearance-meta">
                                                    <span class="appearance-date">${new Date(
                                                      appearance.date
                                                    ).toLocaleDateString(
                                                      "en-US",
                                                      {
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                      }
                                                    )}</span>
                                                    <span class="appearance-type">${
                                                      appearance.type
                                                    }</span>
                                                </div>
                                            </div>
                                            ${
                                              appearance.keywords &&
                                              appearance.keywords.length > 0
                                                ? `
                                                <div class="keywords">
                                                    ${appearance.keywords
                                                      .map(
                                                        (keyword) => `
                                                        <span class="keyword">${keyword}</span>
                                                    `
                                                      )
                                                      .join("")}
                                                </div>
                                            `
                                                : ""
                                            }
                                        </div>
                                    </div>
                                `
                                  )
                                  .join("")}
                            </div>
                        </div>
                    `;
                    })
                    .join("")
                : ""
            }

            ${
              appearancesWithoutPeriod.length > 0
                ? `
                <div class="period-section">
                    ${
                      !personData.periods || personData.periods.length === 0
                        ? ""
                        : '<h3 class="period-title">Other Appearances</h3>'
                    }
                    <div class="appearances-grid">
                        ${appearancesWithoutPeriod
                          .map(
                            (appearance) => `
                            <div class="appearance-card">
                                <div class="appearance-content">
                                    <div class="appearance-header">
                                        <div>
                                            <h4 class="appearance-title">
                                                <a href="${
                                                  appearance.url
                                                }" target="_blank" rel="noopener noreferrer">
                                                    ${appearance.title}
                                                </a>
                                            </h4>
                                        </div>
                                        <div class="appearance-meta">
                                            <span class="appearance-date">${new Date(
                                              appearance.date
                                            ).toLocaleDateString("en-US", {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                            })}</span>
                                            <span class="appearance-type">${
                                              appearance.type
                                            }</span>
                                        </div>
                                    </div>
                                    ${
                                      appearance.keywords &&
                                      appearance.keywords.length > 0
                                        ? `
                                        <div class="keywords">
                                            ${appearance.keywords
                                              .map(
                                                (keyword) => `
                                                <span class="keyword">${keyword}</span>
                                            `
                                              )
                                              .join("")}
                                        </div>
                                    `
                                        : ""
                                    }
                                </div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            `
                : ""
            }
        </div>
    </section>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300", // 5 minute cache
      },
    });
  } catch (error) {
    console.error("Error in personHtmlHandler:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
