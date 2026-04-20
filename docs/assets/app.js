const searchDataElement = document.getElementById("search-data");
const documents = JSON.parse(searchDataElement.textContent);
const searchInput = document.getElementById("doc-search");
const clearSearch = document.getElementById("clear-search");
const searchResults = document.getElementById("search-results");
const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
const sections = Array.from(document.querySelectorAll("[data-section]"));

function normalize(value) {
  return value.toLowerCase().trim();
}

function renderSearchResults(query) {
  const term = normalize(query);

  if (!term) {
    searchResults.innerHTML = "";
    return;
  }

  const matches = [];

  for (const document of documents) {
    const documentText = normalize(
      `${document.title} ${document.source} ${document.description} ${document.text}`,
    );

    if (documentText.includes(term)) {
      matches.push({
        title: document.title,
        href: `#${document.slug}`,
        detail: document.description,
      });
    }

    for (const heading of document.headings) {
      if (normalize(heading.text).includes(term)) {
        matches.push({
          title: heading.text,
          href: `#${heading.id}`,
          detail: `${document.title} / ${document.source}`,
        });
      }
    }
  }

  const unique = [];
  const seen = new Set();
  for (const match of matches) {
    const key = `${match.href}:${match.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(match);
  }

  if (unique.length === 0) {
    searchResults.innerHTML = '<div class="search-result"><strong>没有匹配结果</strong><span>换一个字段名或对象类型试试。</span></div>';
    return;
  }

  searchResults.innerHTML = unique
    .slice(0, 8)
    .map(
      (match) => `<a class="search-result" href="${match.href}">
        <strong>${escapeHtml(match.title)}</strong>
        <span>${escapeHtml(match.detail)}</span>
      </a>`,
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

searchInput.addEventListener("input", (event) => renderSearchResults(event.target.value));

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  renderSearchResults("");
  searchInput.focus();
});

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const slug = visible.target.dataset.section;
    for (const link of navLinks) {
      link.classList.toggle("is-active", link.dataset.navLink === slug);
    }
  },
  { rootMargin: "-20% 0px -65% 0px", threshold: [0.05, 0.2, 0.6] },
);

for (const section of sections) observer.observe(section);
