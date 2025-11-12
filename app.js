// Your free API key from https://www.thesportsdb.com/api.php
const API_KEY = "123"; // Using the test API key

// Define the leagues you want to fetch. Find league IDs on TheSportsDB.
// Example: 4328=English Premier League, 4387=NBA, 4424=NFL
const LEAGUE_IDS = ["4328", "4387", "4424"];

async function render() {
  const container = document.getElementById("categoriesContainer");
  container.innerHTML = "";

  try {
    const matches = await fetchMatchesFromAPI();
    // Filter out any matches that might have already passed
    const upcoming = matches.filter(m => m.date >= new Date());
    displayMatches(upcoming);
  } catch (error) {
    console.error("Failed to load and render matches:", error);
    container.appendChild(emptyAll(error.message));
  }
}

/**
 * Fetches upcoming matches from TheSportsDB API for the configured leagues.
 */
async function fetchMatchesFromAPI() {
  const allMatchPromises = LEAGUE_IDS.map(async (leagueId) => {
    try {
      // This endpoint gets the next 15 events for a given league
      const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsnextleague.php?id=${leagueId}`);
      if (!response.ok) {
        console.error(`API request failed for league ${leagueId}: ${response.statusText}`);
        return [];
      }
      const data = await response.json();

      // The API returns `null` if the league is not found or has no events
      if (!data || !data.events) {
        return [];
      }

      // Transform the API data into the format our website uses
      return data.events.map(event => ({
        id: event.idEvent,
        title: event.strEvent,
        category: event.strLeague,
        // Combine date and time. The API provides them separately.
        // Append 'Z' to ensure the date is parsed as UTC, preventing timezone issues.
        // The API sometimes omits timezone info, which can lead to incorrect local time conversion.
        date: new Date(`${event.dateEvent}T${event.strTime || '00:00:00'}Z`),
        // TheSportsDB doesn't provide a direct preview URL, so we link to a search.
        url: `https://www.thesportsdb.com/event/${event.idEvent}`,
      }));
    } catch (error) {
      console.error(`Error fetching data for league ${leagueId}:`, error);
      return []; // Return empty array on error to not break the whole page
    }
  });

  // Wait for all league fetches to complete and flatten the array of arrays
  const nestedMatches = await Promise.all(allMatchPromises);
  return nestedMatches.flat();
}

function displayMatches(matches) {
  const container = document.getElementById("categoriesContainer");
  if (!matches.length) {
    container.appendChild(emptyAll("No upcoming matches found via API."));
    return;
  }

  // Group by category
  const groups = matches.reduce((acc, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});

  // Sort categories alphabetically
  const cats = Object.keys(groups).sort((a, b) => a.localeCompare(b));
  cats.forEach(cat => {
    // Sort matches by date ascending
    groups[cat].sort((a, b) => a.date - b.date);
    container.appendChild(categoryCard(cat, groups[cat]));
  });
}

function formatDate(d) {
  const date = (d instanceof Date) ? d : new Date(d);
  if (isNaN(date)) return "Invalid Date";
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// --- UI Card Generation ---

function categoryCard(categoryName, items) {
  const section = document.createElement("section");
  section.className = "category-card";

  const header = document.createElement("header");
  header.className = "category-header";
  header.innerHTML = `
    <h3 class="category-title">
      <span class="category-dot"></span>
      ${categoryName}
    </h3>
  `;

  const list = document.createElement("div");
  list.className = "match-list";
  items.forEach(item => list.appendChild(matchCard(item)));

  section.append(header, list);
  return section;
}

function matchCard(m) {
  const a = document.createElement("a");
  a.className = "match-card";
  a.href = m.url;
  a.title = `Open: ${m.title}`;

  // Open external links in a new tab
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  const title = document.createElement("div");
  title.className = "match-title";
  title.textContent = m.title;

  const meta = document.createElement("div");
  meta.className = "match-meta";
  meta.innerHTML = `<span class="meta-chip">${formatDate(m.date)}</span>`;

  const link = document.createElement("div");
  link.className = "view-link";
  link.textContent = "View";

  a.append(title, meta, link);
  return a;
}

function emptyAll(message = "No upcoming matches") {
  const wrap = document.createElement("div");
  wrap.className = "empty-wrap";
  const card = document.createElement("div");
  card.className = "empty-card";
  card.innerHTML = `
    <h3>${message}</h3>
    <p>Check your API key and league IDs in <strong>app.js</strong> or try again later.</p>
  `;
  wrap.appendChild(card);
  return wrap;
}

// Initial render
document.addEventListener("DOMContentLoaded", render);