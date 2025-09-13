/// <reference types="@cloudflare/workers-types" />
/// <reference lib="esnext" />

import { UserContext } from "simplerauth-client";

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
  appearances: Appearance[];
}

interface Env {
  APPEARANCES: DurableObjectNamespace<any>;
  ASSETS: Fetcher;
}

export async function personHtmlHandler(
  request: Request,
  env: Env,
  ctx: UserContext
): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.pathname.replace(".html", "").replace("/", "");

  try {
    // Fetch people list
    const peopleResponse = await env.ASSETS.fetch(
      new Request("http://localhost/people.json")
    );
    const people: Person[] = await peopleResponse.json();

    const person = people.find((p) => p.slug === slug);
    if (!person) {
      return new Response("Person not found", { status: 404 });
    }

    // Check if user is logged in and get follow status
    let isFollowing = false;

    try {
      if (ctx.user?.id) {
        // Check if following this person
        const dbId = env.APPEARANCES.idFromName("main");
        const db = env.APPEARANCES.get(dbId);
        const followedSlugs = await db.getFollowedSlugs(ctx.user.id);
        isFollowing = followedSlugs.includes(slug);
      }
    } catch (error) {
      console.error("Error getting user data:", error);
    }

    // Try to get person data from Durable Object
    let personData: PersonData = { appearances: [], name: slug };
    // Get the Durable Object instance
    const dbId = env.APPEARANCES.idFromName("main");
    const db = env.APPEARANCES.get(dbId);

    personData = await db.getPersonData(slug);

    if (!personData) {
      throw new Error("No data in database");
    }

    // Sort appearances by date (reverse chronological)
    const sortedAppearances = personData.appearances.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Get unique types and keywords for filters
    const uniqueTypes = [...new Set(sortedAppearances.map((a) => a.type))];
    const uniqueKeywords = [
      ...new Set(sortedAppearances.flatMap((a) => a.keywords)),
    ];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${person.name} - Appearances | Based People</title>
    <meta name="description" content="${person.summary}" />
    
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

        .person-name {
            font-size: clamp(2rem, 5vw, 3.5rem);
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #ffffff 0%, #22c55e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .person-category {
            color: #22c55e;
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }

        .person-summary {
            color: #d0d0d0;
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
            max-width: 800px;
        }

        .person-actions {
            display: flex;
            gap: 20px;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .follow-btn {
            padding: 12px 24px;
            background: transparent;
            border: 2px solid #22c55e;
            color: #22c55e;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .follow-btn:hover {
            background: #22c55e;
            color: #0a0a0a;
        }

        .follow-btn.following {
            background: #22c55e;
            color: #0a0a0a;
        }

        .follow-btn.following:hover {
            background: #dc2626;
            border-color: #dc2626;
            color: #ffffff;
        }

        .follow-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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

        .filters {
            margin-bottom: 40px;
            padding: 30px;
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid #333;
        }

        .filter-section {
            margin-bottom: 20px;
        }

        .filter-section:last-child {
            margin-bottom: 0;
        }

        .filter-label {
            color: #22c55e;
            font-weight: 600;
            margin-bottom: 10px;
            display: block;
        }

        .filter-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .filter-btn {
            padding: 6px 12px;
            background: #333;
            border: 1px solid #555;
            border-radius: 6px;
            color: #d0d0d0;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.9rem;
            white-space: nowrap;
        }

        .filter-btn:hover {
            border-color: #22c55e;
            background: #2a2a2a;
        }

        .filter-btn.active {
            background: #22c55e;
            color: #0a0a0a;
            border-color: #22c55e;
        }

        .clear-filters {
            padding: 8px 16px;
            background: transparent;
            border: 1px solid #666;
            border-radius: 6px;
            color: #666;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-left: 10px;
        }

        .clear-filters:hover {
            border-color: #22c55e;
            color: #22c55e;
        }

        .appearances-table {
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid #333;
            overflow: hidden;
        }

        .table-header {
            background: linear-gradient(135deg, #1f1f1f 0%, #0f2a1f 100%);
            padding: 20px;
            border-bottom: 1px solid #333;
        }

        .table-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 0.5rem;
        }

        .table-subtitle {
            color: #a0a0a0;
        }

        .appearance-item {
            padding: 20px;
            border-bottom: 1px solid #2a2a2a;
            transition: all 0.3s ease;
            display: block;
        }

        .appearance-item:last-child {
            border-bottom: none;
        }

        .appearance-item:hover {
            background: #202020;
        }

        .appearance-item.hidden {
            display: none;
        }

        .appearance-header {
            display: flex;
            justify-content: between;
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

        .no-results {
            padding: 60px 20px;
            text-align: center;
            color: #666;
        }

        .no-results-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
            .appearance-header {
                flex-direction: column;
                gap: 5px;
            }

            .appearance-date {
                align-self: flex-start;
            }

            .filter-buttons {
                justify-content: flex-start;
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
            ${ctx.user ? `<a href="/feed" class="nav-link">Your Feed</a>` : ""}
            ${
              ctx.user
                ? `<a href="/logout" class="nav-link">Logout</a>`
                : `<a href="/authorize?redirect_to=${encodeURIComponent(
                    request.url
                  )}" class="nav-link">Login</a>`
            }
        </div>
        
        <div class="header">
            <div class="header-content">
                <h1 class="person-name">${person.name}</h1>
                <div class="person-category">${person.category}</div>
                <p class="person-summary">${person.summary}</p>
                
                ${
                  ctx.user
                    ? `
                    <div class="person-actions">
                        <button class="follow-btn ${
                          isFollowing ? "following" : ""
                        }" 
                                onclick="toggleFollow('${slug}', this)" 
                                data-slug="${slug}">
                            ${isFollowing ? "Following" : "Follow"}
                        </button>
                    </div>
                `
                    : `
                    <div class="person-actions">
                        <button class="follow-btn" onclick="redirectToLogin()">
                            Follow
                        </button>
                    </div>
                `
                }
                
                <div class="stats">
                    <div class="stat">${
                      sortedAppearances.length
                    } Appearances</div>
                    <div class="stat">${uniqueTypes.length} Types</div>
                    <div class="stat">${uniqueKeywords.length} Topics</div>
                </div>
            </div>
        </div>

        <div class="filters">
            <div class="filter-section">
                <span class="filter-label">Filter by Type:</span>
                <div class="filter-buttons">
                    ${uniqueTypes
                      .map(
                        (type) =>
                          `<button class="filter-btn type-filter" data-type="${type}">${type}</button>`
                      )
                      .join("")}
                    <button class="clear-filters" onclick="clearAllFilters()">Clear All</button>
                </div>
            </div>
            
            <div class="filter-section">
                <span class="filter-label">Filter by Keywords:</span>
                <div class="filter-buttons">
                    ${uniqueKeywords
                      .slice(0, 20)
                      .map(
                        (keyword) =>
                          `<button class="filter-btn keyword-filter" data-keyword="${keyword}">${keyword}</button>`
                      )
                      .join("")}
                </div>
            </div>
        </div>

        <div class="appearances-table">
            <div class="table-header">
                <h2 class="table-title">All Appearances</h2>
                <p class="table-subtitle">Chronologically ordered, most recent first</p>
            </div>
            
            <div id="appearances-list">
                ${sortedAppearances
                  .map(
                    (appearance) => `
                    <div class="appearance-item" 
                         data-type="${appearance.type}"
                         data-keywords="${appearance.keywords.join(",")}"
                         data-date="${appearance.date}">
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
            </div>
        </div>

        <div id="no-results" class="no-results" style="display: none;">
            <div class="no-results-icon">🔍</div>
            <h3>No appearances found</h3>
            <p>Try adjusting your filters or clearing all filters to see more results.</p>
        </div>
    </div>

    <script>
        let activeTypeFilters = new Set();
        let activeKeywordFilters = new Set();

        function redirectToLogin() {
            window.location.href = '/authorize?redirect_to=' + encodeURIComponent(window.location.href);
        }

        async function toggleFollow(slug, button) {
            button.disabled = true;
            const wasFollowing = button.classList.contains('following');
            
            try {
                const response = await fetch(\`/toggle/\${slug}\`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                // Handle redirect to login
                if (response.status === 302 || response.redirected) {
                    window.location.href = response.headers.get('Location') || response.url;
                    return;
                }
                
                if (response.status === 401) {
                    const result = await response.json();
                    if (result.redirect) {
                        window.location.href = result.redirect;
                        return;
                    }
                }
                
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                
                const result = await response.json();
                
                if (result.following) {
                    button.classList.add('following');
                    button.textContent = 'Following';
                } else {
                    button.classList.remove('following');
                    button.textContent = 'Follow';
                }
            } catch (error) {
                console.error('Error toggling follow:', error);
                // Revert button state on error
                if (wasFollowing) {
                    button.classList.add('following');
                    button.textContent = 'Following';
                } else {
                    button.classList.remove('following');
                    button.textContent = 'Follow';
                }
            } finally {
                button.disabled = false;
            }
        }

        function updateDisplay() {
            const appearanceItems = document.querySelectorAll('.appearance-item');
            let visibleCount = 0;

            appearanceItems.forEach(item => {
                const itemType = item.dataset.type;
                const itemKeywords = item.dataset.keywords.split(',').filter(k => k.trim());
                
                let showItem = true;

                // Check type filters
                if (activeTypeFilters.size > 0 && !activeTypeFilters.has(itemType)) {
                    showItem = false;
                }

                // Check keyword filters (AND logic - item must have ALL selected keywords)
                if (activeKeywordFilters.size > 0) {
                    const hasAllKeywords = [...activeKeywordFilters].every(keyword => 
                        itemKeywords.includes(keyword)
                    );
                    if (!hasAllKeywords) {
                        showItem = false;
                    }
                }

                if (showItem) {
                    item.classList.remove('hidden');
                    visibleCount++;
                } else {
                    item.classList.add('hidden');
                }
            });

            // Show/hide no results message
            const noResults = document.getElementById('no-results');
            const appearancesList = document.getElementById('appearances-list');
            
            if (visibleCount === 0) {
                noResults.style.display = 'block';
                appearancesList.style.display = 'none';
            } else {
                noResults.style.display = 'none';
                appearancesList.style.display = 'block';
            }
        }

        function clearAllFilters() {
            activeTypeFilters.clear();
            activeKeywordFilters.clear();
            
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            updateDisplay();
        }

        // Type filter handlers
        document.querySelectorAll('.type-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                
                if (activeTypeFilters.has(type)) {
                    activeTypeFilters.delete(type);
                    btn.classList.remove('active');
                } else {
                    activeTypeFilters.add(type);
                    btn.classList.add('active');
                }
                
                updateDisplay();
            });
        });

        // Keyword filter handlers
        document.querySelectorAll('.keyword-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                const keyword = btn.dataset.keyword;
                
                if (activeKeywordFilters.has(keyword)) {
                    activeKeywordFilters.delete(keyword);
                    btn.classList.remove('active');
                } else {
                    activeKeywordFilters.add(keyword);
                    btn.classList.add('active');
                }
                
                updateDisplay();
            });
        });

        // Initialize display
        updateDisplay();
    </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Error in personHtmlHandler:", error);
    return new Response("Internal Server Error: " + error.message, {
      status: 500,
    });
  }
}
