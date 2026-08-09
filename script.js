let allProjects = [];
let activeCategory = "all";

const grid = document.getElementById("grid");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort-select");
const categoryFilters = document.getElementById("category-filters");
const lastUpdatedEl = document.getElementById("last-updated");

function relativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(months / 12)} yr ago`;
}

function buildCategoryChips(projects) {
  const categories = [...new Set(projects.map(p => p.category))].sort();
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.dataset.category = cat;
    btn.textContent = cat;
    btn.addEventListener("click", () => setActiveCategory(cat));
    categoryFilters.appendChild(btn);
  });
}

function setActiveCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll(".chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.category === cat);
  });
  render();
}

function renderCard(project) {
  const card = document.createElement("article");
  card.className = "card";

  const title = document.createElement("h3");
  title.className = "card-title";
  const titleLink = document.createElement("a");
  titleLink.href = project.url;
  titleLink.target = "_blank";
  titleLink.rel = "noopener";
  titleLink.textContent = project.name;
  title.appendChild(titleLink);

  const desc = document.createElement("p");
  desc.className = "card-desc";
  desc.textContent = project.description || "No description yet.";

  const meta = document.createElement("div");
  meta.className = "card-meta";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = project.category;

  const updated = document.createElement("span");
  updated.textContent = `Updated ${relativeTime(project.pushed_at)}`;

  meta.appendChild(tag);
  meta.appendChild(updated);

  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(meta);

  if (project.homepage) {
    const live = document.createElement("a");
    live.className = "live-link";
    live.href = project.homepage;
    live.target = "_blank";
    live.rel = "noopener";
    live.textContent = "View live site →";
    card.appendChild(live);
  }

  return card;
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const sortBy = sortSelect.value;

  let filtered = allProjects.filter(p => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch = !query ||
      p.name.toLowerCase().includes(query) ||
      (p.description || "").toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  filtered.sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === "updated") return new Date(b.pushed_at) - new Date(a.pushed_at);
    return 0;
  });

  grid.innerHTML = "";
  emptyState.hidden = filtered.length > 0;
  filtered.forEach(p => grid.appendChild(renderCard(p)));
}

async function init() {
  try {
    const res = await fetch("data.json");
    const data = await res.json();
    allProjects = data.projects || [];
    lastUpdatedEl.textContent = `last run ${relativeTime(data.generated_at)}`;
    buildCategoryChips(allProjects);
    render();
  } catch (err) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.textContent = "Couldn't load project data — check back soon.";
  }
}

searchInput.addEventListener("input", render);
sortSelect.addEventListener("change", render);

init();
