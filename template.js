const fs = require("fs");

function createIndex() {
  try {
    // Read template and people data
    const template = fs.readFileSync("template.html", "utf8");
    const peopleData = JSON.parse(fs.readFileSync("people.json", "utf8"));

    // Generate people cards HTML
    const peopleCardsHtml = peopleData
      .map(
        (person) => `
                <div class="person-card">
                    <div class="person-name">${person.name}</div>
                    <div class="person-category">${person.category}</div>
                    <div class="person-summary">${person.summary}</div>
                    <div class="person-actions">
                        <button class="btn-follow" data-slug="${person.slug}" 
                                onclick="toggleFollow('${person.slug}', '${person.name}')">
                            Follow
                        </button>
                        <a href="/${person.slug}.html" class="btn-view">View</a>
                    </div>
                </div>`
      )
      .join("\n");

    // Generate "Your Based People" section HTML
    const yourPeopleSectionHtml = `
    <section id="your-people-section" class="your-people-section">
        <div class="container">
            <h2 class="section-title">Your Based People</h2>
            <div id="your-people-grid" class="people-grid">
                <!-- Dynamically populated by JavaScript -->
            </div>
            <div style="text-align: center; margin-top: 2rem;">
                <a href="/feed" class="cta-button">View Your Feed →</a>
            </div>
        </div>
    </section>`;

    // Replace placeholders in template
    let html = template.replace(
      "<!-- PEOPLE_CARDS_PLACEHOLDER -->",
      peopleCardsHtml
    );
    html = html.replace(
      "<!-- YOUR_PEOPLE_SECTION_PLACEHOLDER -->",
      yourPeopleSectionHtml
    );

    // Write the final HTML
    fs.writeFileSync("index.html", html);

    console.log(
      `✅ Successfully created index.html with ${peopleData.length} people`
    );
  } catch (error) {
    console.error("❌ Error creating index.html:", error.message);
    process.exit(1);
  }
}

// Run the script
createIndex();
