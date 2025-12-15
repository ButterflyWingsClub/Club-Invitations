// phase1-extract-ladies.js
module.exports = async function runStatsExtractor(page) {
  console.log("🚀 Starting Phase 1: Lady ID Extraction (No Club)");

  // 🔧 MANUAL INPUT
  const startPage = 1;   // ← change manually
  const endPage   = 1;   // ← change manually
  const tierId    = 10;

  if (startPage < 1 || endPage < startPage) {
    console.log("❌ Invalid page range");
    return;
  }

  const rankingAjaxUrl =
    "https://v3.g.ladypopular.com/ajax/ranking/players.php";

  const ladiesWithoutClub = [];

  // Ensure session cookies exist
  await page.goto("https://v3.g.ladypopular.com", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.waitForTimeout(3000);

  console.log(`🔍 Scanning pages ${startPage} → ${endPage}`);

  for (let currentPage = startPage; currentPage <= endPage; currentPage++) {
    console.log(`📄 Processing page ${currentPage}...`);

    try {
      const response = await page.request.post(rankingAjaxUrl, {
        form: {
          action: "getRanking",
          page: String(currentPage),
          tierId: String(tierId),
        },
        timeout: 60000,
      });

      if (!response.ok()) {
        console.log(`❌ HTTP error on page ${currentPage}`);
        continue;
      }

      const data = await response.json();

      if (data.status !== 1 || !data.html) {
        console.log(`❌ Invalid response structure on page ${currentPage}`);
        continue;
      }

      const extracted = await page.evaluate((html) => {
        const container = document.createElement("div");
        container.innerHTML = html;

        const rows = container.querySelectorAll("tbody tr");
        const results = [];

        rows.forEach((row) => {
          const guildCell = row.querySelector(".ranking-player-guild");

          // Lady WITHOUT club
          if (guildCell && guildCell.children.length === 0) {
            const profileLink = row.querySelector(
              'a[href^="/profile.php?id="]'
            );

            if (!profileLink) return;

            const href = profileLink.getAttribute("href");
            const match = href.match(/id=(\d+)/);

            if (!match) return;

            const ladyId = match[1];
            const nameEl = row.querySelector(".player-avatar-name");

            results.push({
              ladyId,
              name: nameEl ? nameEl.textContent.trim() : "Unknown",
              profileUrl: href,
            });
          }
        });

        return results;
      }, data.html);

      ladiesWithoutClub.push(...extracted);
      console.log(`   🎯 Found ${extracted.length} ladies without club`);

    } catch (err) {
      console.log(`❌ Error on page ${currentPage}: ${err.message}`);
    }

    await page.waitForTimeout(2000);
  }

  console.log("\n✅ Phase 1 Complete");
  console.log(`👭 Total ladies without club: ${ladiesWithoutClub.length}`);

  console.log("📋 Sample output:");
  console.log(ladiesWithoutClub.slice(0, 5));

  // We will use this array in Phase 2
  return ladiesWithoutClub;
};
