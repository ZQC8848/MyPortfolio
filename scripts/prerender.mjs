// Post-build step: gives every route its own HTML file.
//
// The site is a client-rendered SPA, so before this step every URL returned the
// same index.html: the home page's title, description and canonical link, and
// an empty <div id="root">. Crawlers that read the raw HTML (Bing, Baidu and
// others) therefore saw each project page as a copy of the home page.
//
// For each project this writes dist/project/<slug>/index.html with its own head
// tags, structured data, and a plain-text copy of the page inside #root. React
// replaces that copy as soon as the app mounts. The home page gets the same
// treatment, including crawlable links to every project.
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const template = readFileSync(path.join(dist, "index.html"), "utf8");

const vite = await createServer({
  root,
  appType: "custom",
  server: { middlewareMode: true },
  logLevel: "error",
});
const { projects, site } = await vite.ssrLoadModule("/src/content/site.tsx");
const { pageMeta, SITE_URL } = await vite.ssrLoadModule("/src/lib/seo.ts");
await vite.close();

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const html = (node) => renderToStaticMarkup(createElement(Fragment, null, node));

function replaceOnce(source, pattern, replacement) {
  if (!pattern.test(source)) {
    throw new Error(`prerender: template has no match for ${pattern}`);
  }
  return source.replace(pattern, () => replacement);
}
const metaTag = (attr, key) =>
  new RegExp(`<meta\\s+(?:[^>]*?\\s)?${attr}="${key}"[^>]*>`);

function withHead(source, meta) {
  let out = source;
  out = replaceOnce(out, /<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`);
  out = replaceOnce(out, /<link\s+rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(meta.url)}" />`);
  const tags = [
    ["name", "description", meta.description],
    ["property", "og:title", meta.title],
    ["property", "og:description", meta.ogDescription],
    ["property", "og:url", meta.url],
    ["property", "og:image", meta.image],
    ["name", "twitter:title", meta.title],
    ["name", "twitter:description", meta.ogDescription],
    ["name", "twitter:image", meta.image],
  ];
  for (const [attr, key, content] of tags) {
    out = replaceOnce(out, metaTag(attr, key), `<meta ${attr}="${key}" content="${esc(content)}" />`);
  }
  return out;
}

const hidden =
  "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%)";

function withBody(source, content) {
  return replaceOnce(
    source,
    /<div id="root"><\/div>/,
    `<div id="root"><div style="${hidden}">${content}</div></div>`
  );
}

const projectLinks = projects
  .map(
    (p) =>
      `<li><a href="/project/${esc(p.slug)}">${esc(p.title)}</a>: ${esc(p.blurb)}</li>`
  )
  .join("");

// Home page: head is already correct in the built file, so only add content.
const homeBody =
  `<nav><a href="/#work">Work</a> <a href="/#about">About</a> <a href="/#contact">Contact</a></nav>` +
  `<h1>${esc(site.fullName)} 张秦川</h1>` +
  `<p>${esc(site.hero.eyebrow)}</p>` +
  `<h2>${html(site.about.lead)}</h2>` +
  `<p>${esc(site.about.sub)}</p>` +
  site.about.columns
    .map((c) => `<h3>${esc(c.heading)}</h3><p>${esc(c.body)}</p>`)
    .join("") +
  `<h2>Projects</h2><ul>${projectLinks}</ul>` +
  `<p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>`;
writeFileSync(path.join(dist, "index.html"), withBody(template, homeBody));

for (const project of projects) {
  const meta = pageMeta(`/project/${project.slug}`);
  const ld = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: meta.description,
    url: meta.url,
    image: meta.image,
    keywords: project.tag.split("·").map((t) => t.trim()).filter(Boolean).join(", "),
    author: { "@type": "Person", name: site.fullName, url: `${SITE_URL}/` },
  };
  const ldTag = `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;

  const body =
    `<nav><a href="/">${esc(site.fullName)}</a> <a href="/#work">Work</a> <a href="/#archive">Archive</a></nav>` +
    `<article><p>${esc(project.tag)}</p><h1>${esc(project.title)}</h1>` +
    `<p>${esc(project.blurb)}</p>` +
    `<dl>${project.meta.map((m) => `<dt>${esc(m.label)}</dt><dd>${esc(m.value)}</dd>`).join("")}</dl>` +
    project.sections
      .map((s) => `<section><h2>${esc(s.heading)}</h2><p>${html(s.body)}</p></section>`)
      .join("") +
    `</article>`;

  let page = withHead(template, meta);
  page = replaceOnce(page, /<\/head>/, `${ldTag}\n  </head>`);
  page = withBody(page, body);

  const dir = path.join(dist, "project", project.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "index.html"), page);
}

console.log(`prerender: wrote ${projects.length + 1} pages`);
