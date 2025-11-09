// ========= Basic data + helper to add and render matches =========

// Add your matches here using addMatch(...). Example at bottom.
// Each match: title, category, date (local time), optional url.
// If url is omitted, it will link to matches/<slug-from-title>.html

const matches = [];

// Helper: create a URL-friendly slug
function slugify(text) {
  return String(text)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Helper: safe date parsing (accepts "YYYY-MM-DD HH:mm" or ISO)
function toDate(d) {
  if (d instanceof Date) return d;
  if (typeof d === "number") return new Date(d);
  if (typeof d === "string") {
    // allow "YYYY-MM-DD HH:mm"
    const normalized = d.includes("T") ? d : d.replace(" ", "T");
    const dt = new Date(normalized);
    if (!isNaN(dt)) return dt;
  }
  return new Date(d);
}

function formatDate(d) {
  const date = toDate(d);
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Public function to add a match
// Usage:
// addMatch("Arsenal vs Spurs", "Football", "2025-09-14 16:30");
// or addMatch({ title: "...", category: "...", date: "...", url: "..." })
function addMatch(titleOrObj, category, date, url) {
  const data = typeof titleOrObj === "object"
    ? titleOrObj
    : { title: titleOrObj, category, date, url };

  if (!data.title || !data.category || !data.date) {
    console.warn("addMatch requires title, category, and date.");
    return null;
  }

  const id = cryptoRandomId();
  const title = String(data.title).trim();
  const cat = String(data.category).trim();
  const slug = slugify(title);
  const catSlug = slugify(cat);
  const when = toDate(data.date);
  const link = data.url || `matches/${slug}.html`;

  const match = { id, title, category: cat, categorySlug: catSlug, date: when, url: link, slug };
  matches.push(match);
  render();
  return match;
}

// Simple random id
function cryptoRandomId() {
  if (window.crypto?.getRandomValues) {
    const a = new Uint32Array(2);
    crypto.getRandomValues(a);
    return [...a].map(n => n.toString(36)).join("");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Group matches by category and render them
function render() {
  const container = document.getElementById("categoriesContainer");
  container.innerHTML = "";

  if (!matches.length) {
    container.appendChild(emptyAll());
    return;
  }

  // Group by category
  const groups = matches.reduce((acc, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});

  // Sort categories alpha
  const cats = Object.keys(groups).sort((a, b) => a.localeCompare(b));
  cats.forEach(cat => {
    // Sort matches by date ascending
    groups[cat].sort((a, b) => toDate(a.date) - toDate(b.date));
    container.appendChild(categoryCard(cat, groups[cat]));
  });
}

function categoryCard(categoryName, items) {
  const section = document.createElement("section");
  section.className = "category-card";

  const header = document.createElement("div");
  header.className = "category-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "category-title";

  const dot = document.createElement("span");
  dot.className = "category-dot";

  const title = document.createElement("h2");
  title.textContent = categoryName;
  title.style.margin = "0";
  title.style.fontSize = "18px";

  titleWrap.append(dot, title);
  header.appendChild(titleWrap);

  const list = document.createElement("div");
  list.className = "match-list";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty-wrap";
    empty.innerHTML = `<div class="empty-card"><h3>No matches here yet</h3><p>Add some in app.js</p></div>`;
    list.appendChild(empty);
  } else {
    items.forEach(m => list.appendChild(matchCard(m)));
  }

  section.append(header, list);
  return section;
}

function matchCard(m) {
  const a = document.createElement("a");
  a.className = "match-card";
  a.href = m.url;
  a.title = `Open: ${m.title}`;

  const title = document.createElement("div");
  title.className = "match-title";
  title.textContent = m.title;

  const cta = document.createElement("div");
  cta.className = "view-link";
  cta.textContent = "Preview";

  const meta = document.createElement("div");
  meta.className = "match-meta";

  const dateChip = document.createElement("span");
  dateChip.className = "meta-chip";
  dateChip.innerHTML = `📅 ${formatDate(m.date)}`;

  meta.append(dateChip);
  a.append(title, cta, meta);
  return a;
}

function emptyAll() {
  const wrap = document.createElement("div");
  wrap.className = "empty-wrap";
  const card = document.createElement("div");
  card.className = "empty-card";
  card.innerHTML = `
    <h3>No upcoming matches</h3>
    <p>Open <strong>app.js</strong> and add some using <code>addMatch(...)</code>.</p>
  `;
  wrap.appendChild(card);
  return wrap;
}

// Initial render (empty)
document.addEventListener("DOMContentLoaded", render);

// ======= ADD YOUR MATCHES BELOW (examples) =======
// Remove the // to add your own:
addMatch("Georgia vs Bulgaria", "UEFA World Cup Qualifying", "2025-09-07 13:00");
addMatch("Lithuania vs Netherlands", "UEFA World Cup Qualifying", "2025-09-07 16:00");

// addMatch("Arsenal vs Spurs", "Football", "2025-09-14 16:30");
// addMatch("Lakers vs Celtics", "Basketball", "2025-10-04 19:00");
// addMatch({
//   title: "Medvedev vs Alcaraz",
//   category: "Tennis",
//   date: "2025-09-20 14:00",
//   // url: "matches/medvedev-vs-alcaraz.html" // optional, auto-generated if not provided
// });