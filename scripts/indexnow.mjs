// Tells IndexNow-enabled search engines (Bing, Yandex, Naver, Seznam) that the
// URLs in sitemap.xml changed, so they recrawl instead of waiting for a visit.
// Run after a production deploy: npm run indexnow
// Google does not support IndexNow; use Search Console for Google.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const host = "qinchuan.dev";
const keyFile = readdirSync(path.join(root, "public")).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("indexnow: no <key>.txt file in public/");
const key = keyFile.replace(".txt", "");

const sitemap = readFileSync(path.join(root, "public", "sitemap.xml"), "utf8");
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${keyFile}`, urlList }),
});
console.log(`indexnow: submitted ${urlList.length} URLs, HTTP ${res.status}`);
if (res.status >= 300) console.log(await res.text());
