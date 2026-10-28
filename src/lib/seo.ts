import { projects, site } from "../content/site";

export const SITE_URL = "https://qinchuan.dev";
const HOME_IMAGE = `${SITE_URL}/cover.png`;
const HOME_OG_DESCRIPTION =
  "XR · AI · Game developer — immersive experiences where XR, AI & play converge.";

export interface PageMeta {
  title: string;
  description: string;
  ogDescription: string;
  url: string;
  image: string;
  /** Present on project pages only. */
  slug?: string;
}

/** Search snippets cut off near 160 characters, so end on a word before that. */
function clip(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "")}…`;
}

/**
 * Title, description, canonical URL and share image for a route. Shared by the
 * browser (client-side navigation) and by scripts/prerender.mjs, so the HTML
 * that crawlers fetch matches what the page sets itself after it loads.
 */
export function pageMeta(pathname: string): PageMeta {
  const match = pathname.match(/^\/project\/([^/]+)\/?$/);
  const project = match && projects.find((p) => p.slug === match[1]);
  if (!project) {
    return {
      title: site.meta.title,
      description: site.meta.description,
      ogDescription: HOME_OG_DESCRIPTION,
      url: `${SITE_URL}/`,
      image: HOME_IMAGE,
    };
  }
  const description = clip(project.blurb);
  return {
    title: `${project.title} — ${site.fullName}`,
    description,
    ogDescription: description,
    url: `${SITE_URL}/project/${project.slug}`,
    image: project.cover ? `${SITE_URL}${project.cover}` : HOME_IMAGE,
    slug: project.slug,
  };
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Keeps the tab title, canonical link and share tags in step with the route. */
export function applyHead(pathname: string): void {
  const meta = pageMeta(pathname);
  document.title = meta.title;
  setMeta("name", "description", meta.description);
  setMeta("property", "og:title", meta.title);
  setMeta("property", "og:description", meta.ogDescription);
  setMeta("property", "og:url", meta.url);
  setMeta("property", "og:image", meta.image);
  setMeta("name", "twitter:title", meta.title);
  setMeta("name", "twitter:description", meta.ogDescription);
  setMeta("name", "twitter:image", meta.image);
  let canonical = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = meta.url;
}
