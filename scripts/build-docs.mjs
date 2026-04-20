import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const siteDir = path.join(rootDir, "docs");
const assetDir = path.join(siteDir, "assets");

const documents = [
  {
    title: "项目概览",
    source: "README.md",
    slug: "overview",
    group: "入门",
    description: "项目用途、阅读方式和兼容性说明。",
  },
  {
    title: "协议入口",
    source: "protocol/README.md",
    slug: "protocol",
    group: "入门",
    description: "pptxProperty 的整体结构和推荐阅读顺序。",
  },
  {
    title: "核心协议",
    source: "protocol/core.md",
    slug: "core",
    group: "基础结构",
    description: "顶层结构、通用类型、坐标、颜色、填充和边框。",
  },
  {
    title: "幻灯片母版协议",
    source: "protocol/slideMaster.md",
    slug: "slide-master",
    group: "基础结构",
    description: "母版、版式、主题、颜色映射和占位符。",
  },
  {
    title: "页面协议",
    source: "protocol/page.md",
    slug: "page",
    group: "基础结构",
    description: "页面结构、页面扩展信息和对象挂载方式。",
  },
  {
    title: "对象协议",
    source: "protocol/object/README.md",
    slug: "object",
    group: "对象",
    description: "页面对象树、对象类型和解析规则。",
  },
  {
    title: "对象公共属性",
    source: "protocol/object/common-property.md",
    slug: "common-property",
    group: "对象",
    description: "对象共享的几何、填充、边框、阴影和交互属性。",
  },
  {
    title: "文本对象",
    source: "protocol/object/text.md",
    slug: "text",
    group: "对象",
    description: "文本框、段落、文本片段和富文本组合。",
  },
  {
    title: "图片对象",
    source: "protocol/object/image.md",
    slug: "image",
    group: "对象",
    description: "图片资源、不透明度、裁剪和媒体封面。",
  },
  {
    title: "表格对象",
    source: "protocol/object/table.md",
    slug: "table",
    group: "对象",
    description: "表格、行、单元格、合并单元格和单元格文本。",
  },
  {
    title: "分组对象",
    source: "protocol/object/container.md",
    slug: "container",
    group: "对象",
    description: "分组坐标系、嵌套、移动和缩放。",
  },
  {
    title: "其他对象",
    source: "protocol/object/other-objects.md",
    slug: "other-objects",
    group: "对象",
    description: "音频、视频和页面媒体动画扩展。",
  },
];

const linkTargetBySource = new Map(
  documents.map((document) => [normalizeSource(document.source), document.slug]),
);

function normalizeSource(source) {
  return source.replace(/\\/g, "/").replace(/^\.\//, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(text, fallback) {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[`"'“”‘’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function inlineMarkdown(text, currentSource) {
  let html = escapeHtml(text);

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    if (/^(https?:|mailto:|#)/.test(href)) {
      return `<a href="${escapeHtml(href)}">${label}</a>`;
    }

    return `<a href="${escapeHtml(resolveLinkHref(currentSource, href))}">${label}</a>`;
  });

  return html;
}

function resolveLinkHref(currentSource, href) {
  const [hrefPath, fragment] = href.split("#");
  const currentDir = path.posix.dirname(normalizeSource(currentSource));
  const resolved = normalizeSource(
    path.posix.normalize(path.posix.join(currentDir, hrefPath)),
  );
  const slug = linkTargetBySource.get(resolved) ?? linkTargetBySource.get(hrefPath);

  if (slug) {
    return fragment ? `#${slug}-${slugify(fragment, "section")}` : `#${slug}`;
  }

  if (existsSync(path.join(rootDir, resolved))) {
    return fragment ? `source/${resolved}#${fragment}` : `source/${resolved}`;
  }

  return href;
}

function parseTable(lines, startIndex, currentSource) {
  const header = splitTableRow(lines[startIndex]);
  const align = splitTableRow(lines[startIndex + 1]);
  const rows = [];
  let index = startIndex + 2;

  while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
    rows.push(splitTableRow(lines[index]));
    index += 1;
  }

  const colCount = Math.max(header.length, ...rows.map((row) => row.length), 1);
  const tableHead = header
    .slice(0, colCount)
    .map((cell) => `<th>${inlineMarkdown(cell.trim(), currentSource)}</th>`)
    .join("");
  const tableRows = rows
    .map((row) => {
      const cells = Array.from({ length: colCount }, (_, cellIndex) => row[cellIndex] ?? "");
      return `<tr>${cells
        .map((cell) => `<td>${inlineMarkdown(cell.trim(), currentSource)}</td>`)
        .join("")}</tr>`;
    })
    .join("\n");

  return {
    html: `<div class="table-wrap"><table><thead><tr>${tableHead}</tr></thead><tbody>${tableRows}</tbody></table></div>`,
    nextIndex: index,
  };
}

function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let current = "";
  let inCode = false;

  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index];

    if (char === "`") {
      inCode = !inCode;
      current += char;
      continue;
    }

    if (char === "|" && !inCode) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseList(lines, startIndex, currentSource) {
  const ordered = /^\s*\d+\.\s+/.test(lines[startIndex]);
  const items = [];
  let index = startIndex;
  const pattern = ordered ? /^\s*\d+\.\s+(.+)$/ : /^\s*-\s+(.+)$/;

  while (index < lines.length && pattern.test(lines[index])) {
    const match = lines[index].match(pattern);
    items.push(`<li>${inlineMarkdown(match[1], currentSource)}</li>`);
    index += 1;
  }

  const tag = ordered ? "ol" : "ul";
  return { html: `<${tag}>${items.join("")}</${tag}>`, nextIndex: index };
}

function renderMarkdown(markdown, document) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  const headings = [];
  let index = 0;
  let headingIndex = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      const language = fence[1] || "text";
      const code = [];
      index += 1;

      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }

      index += 1;
      html.push(
        `<figure class="code-card"><figcaption>${escapeHtml(language)}</figcaption><pre><code>${escapeHtml(
          code.join("\n"),
        )}</code></pre></figure>`,
      );
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = `${document.slug}-${slugify(text, `heading-${headingIndex}`)}`;
      headingIndex += 1;
      headings.push({ id, level, text });
      html.push(
        `<h${level} id="${id}"><a class="anchor" href="#${id}" aria-label="定位到 ${escapeHtml(
          text,
        )}">#</a>${inlineMarkdown(text, document.source)}</h${level}>`,
      );
      index += 1;
      continue;
    }

    if (
      /^\s*\|.*\|\s*$/.test(line) &&
      index + 1 < lines.length &&
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1])
    ) {
      const table = parseTable(lines, index, document.source);
      html.push(table.html);
      index = table.nextIndex;
      continue;
    }

    if (/^\s*(-|\d+\.)\s+/.test(line)) {
      const list = parseList(lines, index, document.source);
      html.push(list.html);
      index = list.nextIndex;
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !/^```/.test(lines[index]) &&
      !/^(#{1,4})\s+/.test(lines[index]) &&
      !/^\s*\|.*\|\s*$/.test(lines[index]) &&
      !/^\s*(-|\d+\.)\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }

    html.push(`<p>${inlineMarkdown(paragraph.join(" "), document.source)}</p>`);
  }

  return { html: html.join("\n"), headings };
}

function countStats(markdown) {
  return {
    codeBlocks: (markdown.match(/```/g) || []).length / 2,
    tables: markdown.split(/\r?\n/).filter((line) => /^\s*\|.*\|\s*$/.test(line)).length,
    fields: (markdown.match(/`[A-Za-z][^`]*`/g) || []).length,
  };
}

function createDocumentSection(document) {
  const markdown = readFileSync(path.join(rootDir, document.source), "utf8");
  const rendered = renderMarkdown(markdown, document);
  const stats = countStats(markdown);

  return {
    ...document,
    ...rendered,
    stats,
    text: markdown
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/[#*`|[\]()]/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  };
}

function groupedNav(sections) {
  const groups = new Map();

  for (const section of sections) {
    if (!groups.has(section.group)) groups.set(section.group, []);
    groups.get(section.group).push(section);
  }

  return Array.from(groups.entries())
    .map(
      ([group, items]) => `<section class="nav-group">
        <h2>${escapeHtml(group)}</h2>
        ${items
          .map(
            (item) => `<a class="nav-link" href="#${item.slug}" data-nav-link="${item.slug}">
              <span>${escapeHtml(item.title)}</span>
              <small>${escapeHtml(item.source)}</small>
            </a>`,
          )
          .join("")}
      </section>`,
    )
    .join("\n");
}

function outline(sections) {
  return sections
    .map(
      (section) => `<section class="outline-group" data-outline-group="${section.slug}">
        <h2>${escapeHtml(section.title)}</h2>
        ${section.headings
          .filter((heading) => heading.level > 1 && heading.level < 4)
          .map(
            (heading) =>
              `<a class="outline-link level-${heading.level}" href="#${heading.id}">${escapeHtml(
                heading.text,
              )}</a>`,
          )
          .join("")}
      </section>`,
    )
    .join("\n");
}

function buildSearchData(sections) {
  return sections.map((section) => ({
    title: section.title,
    slug: section.slug,
    source: section.source,
    description: section.description,
    text: section.text,
    headings: section.headings.map(({ id, text, level }) => ({ id, text, level })),
  }));
}

function jsonForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function pageShell(sections) {
  const totals = sections.reduce(
    (acc, section) => {
      acc.codeBlocks += section.stats.codeBlocks;
      acc.tables += section.stats.tables;
      acc.fields += section.stats.fields;
      return acc;
    },
    { codeBlocks: 0, tables: 0, fields: 0 },
  );

  const searchData = jsonForScript(buildSearchData(sections));

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>docmee-pptxProperty 结构协议</title>
    <meta name="description" content="Docmee pptxProperty JSON 结构协议在线文档。">
    <link rel="stylesheet" href="assets/styles.css">
  </head>
  <body>
    <div class="site-frame">
      <aside class="side-nav" aria-label="文档导航">
        <a class="brand" href="#top" aria-label="回到顶部">
          <span class="brand-mark">DP</span>
          <span>
            <strong>pptxProperty</strong>
            <small>结构协议</small>
          </span>
        </a>
        <nav>
          ${groupedNav(sections)}
        </nav>
      </aside>

      <main id="top" class="content">
        <header class="hero">
          <div class="hero-copy">
            <p class="eyebrow">Docmee protocol reference</p>
            <h1>docmee-pptxProperty 结构协议</h1>
            <p class="lead">面向第三方开发者的 PPTX 结构数据说明：从顶层字段、母版版式，到页面对象树、文本、图片、表格、分组和媒体扩展。</p>
            <div class="hero-actions">
              <a class="primary-action" href="#core">开始阅读</a>
              <a class="secondary-action" href="#object">查看对象协议</a>
            </div>
          </div>

          <div class="protocol-map" aria-label="pptxProperty 结构图">
            <div class="map-node root">pptxProperty</div>
            <div class="map-branches">
              <a href="#core" class="map-node">width / height / font</a>
              <a href="#page" class="map-node">pages[]</a>
              <a href="#slide-master" class="map-node">slideMasters[]</a>
              <a href="#object" class="map-node">children[] object tree</a>
            </div>
          </div>
        </header>

        <section class="utility-panel" aria-label="文档工具">
          <div class="search-box">
            <label for="doc-search">搜索字段、对象或章节</label>
            <div class="search-control">
              <input id="doc-search" type="search" autocomplete="off" placeholder="例如：slideMasterIdx、fillStyle、tableColumn">
              <button id="clear-search" type="button" aria-label="清空搜索">清空</button>
            </div>
            <div id="search-results" class="search-results" role="status" aria-live="polite"></div>
          </div>

          <div class="stat-grid" aria-label="文档统计">
            <div><strong>${sections.length}</strong><span>篇文档</span></div>
            <div><strong>${totals.codeBlocks}</strong><span>段代码</span></div>
            <div><strong>${totals.tables}</strong><span>张表格</span></div>
            <div><strong>${totals.fields}</strong><span>字段标记</span></div>
          </div>
        </section>

        <section class="reading-route" aria-labelledby="route-title">
          <div>
            <p class="eyebrow">Recommended route</p>
            <h2 id="route-title">建议阅读路径</h2>
          </div>
          <ol>
            <li><a href="#core">核心协议</a><span>确认顶层结构、坐标、颜色与通用类型。</span></li>
            <li><a href="#slide-master">母版协议</a><span>理解主题、版式、颜色映射和占位符继承。</span></li>
            <li><a href="#page">页面协议</a><span>处理页面与母版/版式之间的索引关系。</span></li>
            <li><a href="#object">对象协议</a><span>按对象类型解析文本、图片、表格、分组和媒体。</span></li>
          </ol>
        </section>

        <div class="doc-stack">
          ${sections
            .map(
              (section) => `<article class="doc-section" id="${section.slug}" data-section="${section.slug}">
                <header class="doc-header">
                  <div>
                    <p class="source-path">${escapeHtml(section.source)}</p>
                    <h2>${escapeHtml(section.title)}</h2>
                    <p>${escapeHtml(section.description)}</p>
                  </div>
                  <a class="source-link" href="source/${escapeHtml(section.source)}">源 Markdown</a>
                </header>
                <div class="markdown-body">
                  ${section.html}
                </div>
              </article>`,
            )
            .join("\n")}
        </div>
      </main>

      <aside class="outline" aria-label="章节大纲">
        <h1>章节大纲</h1>
        ${outline(sections)}
      </aside>
    </div>
    <button class="menu-toggle" type="button" aria-controls="site-navigation" aria-expanded="false">目录</button>
    <script id="search-data" type="application/json">${searchData}</script>
    <script src="assets/app.js" type="module"></script>
  </body>
</html>`;
}

mkdirSync(assetDir, { recursive: true });

const sections = documents.map(createDocumentSection);
writeFileSync(path.join(siteDir, "index.html"), pageShell(sections));

for (const document of documents) {
  const sourcePath = path.join(rootDir, document.source);
  const outputPath = path.join(siteDir, "source", document.source);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  copyFileSync(sourcePath, outputPath);
}

for (const extraSource of ["example/example.json", "example/audio_shadow.json"]) {
  const sourcePath = path.join(rootDir, extraSource);
  if (!existsSync(sourcePath)) continue;

  const outputPath = path.join(siteDir, "source", extraSource);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  copyFileSync(sourcePath, outputPath);
}

console.log(`Built ${sections.length} documents into ${path.relative(rootDir, siteDir)}/index.html`);
