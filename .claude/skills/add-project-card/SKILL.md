---
name: add-project-card
description: Add a new project card (with detail page and embedded video) to the personal portfolio at D:\PersonalPortfolio, sourcing content from the Obsidian vault at D:\ObsidianVault. Use this whenever the user asks to add a project, add a card, 添加项目, 加卡片, put a new work on the portfolio site, or mentions moving a project from Obsidian/notes onto the website — even if they only name the project without saying "card".
---

# Add a Project Card to the Portfolio

Adds one project to the portfolio's Work section: a card in the grid plus a
detail page at `/project/<slug>` with metadata, an embedded video, and
distilled description sections.

The single source of truth for projects is the `projects` array in
`src/content/site.tsx`. Cards and detail pages are generated from it — no
component code needs to change when adding a project.

## Where the content lives

| What | Location |
| --- | --- |
| Project notes | `D:\ObsidianVault\Projects\Featured Projects\<Name>.md` (longer reports may sit in `D:\ObsidianVault\Projects\<Name>\`) |
| Images | `D:\ObsidianVault\Resources\` — note frontmatter `cover: "[[file.png]]"` names the cover; body embeds `![[image.png]]` name figures |
| Video link | First `![](https://youtu.be/... or vimeo.com/...)` embed in the note body |
| Site data | `D:\PersonalPortfolio\src\content\site.tsx` → `projects: Project[]` |
| Web images | `D:\PersonalPortfolio\public\projects\` |

## Workflow

1. **Read the note.** Find the project's `.md` in the vault (case-insensitive,
   user may abbreviate the name). Extract: cover filename, tags, date, video
   URL, and the description body.

2. **Check the three ingredients** — cover image (exists in Resources), video
   link, and real description text (not just a video embed). Many vault notes
   are video-only. If something is missing, don't silently ship a thin page:
   tell the user what's missing and ask whether to (a) draft a short
   description for them from the video/tags/old site, (b) proceed without
   that ingredient (no video → cover image hero; no cover → gradient
   placeholder card, already styled), or (c) wait until they fill the note.

3. **Copy images** into `public/projects/` with kebab-case names derived from
   the slug (e.g. `syncscape.png`, `syncscape-pano.png`). Obsidian filenames
   often contain spaces or hash-like names — never reference the vault paths
   directly; the site must be self-contained.

4. **Convert the video URL to an embed id.** Watch URLs don't embed.
   - `https://youtu.be/<id>?...` or `youtube.com/watch?v=<id>` → `{ type: "youtube", id: "<id>" }` (strip query params like `?si=`)
   - `https://vimeo.com/<digits>?...` → `{ type: "vimeo", id: "<digits>" }`

5. **Write the entry** in `src/content/site.tsx`, appended to `projects`
   (or where the user wants it ordered — order = display order):

   ```tsx
   {
     slug: "kebab-case-name",        // becomes /project/<slug>
     title: "Display Name",
     tag: "Domain · Tech · Year",    // card corner + detail header
     blurb: "One sentence, ~15 words, what + why it's interesting.",
     cover: "/projects/<slug>.png",  // omit → gradient placeholder card
     video: { type: "youtube", id: "..." },  // omit → cover image as hero
     meta: [                          // 2–3 entries shown under the title
       { label: "Type", value: "Research · XR" },
       { label: "Stack", value: "Unity 6 · Photon Fusion 2" },
       { label: "Date", value: "2026" },
     ],
     sections: [                      // 3–4 sections, distilled
       { heading: "Overview", body: <>...</> },
       { heading: "How it works", body: <>...</>,
         image: { src: "/projects/<slug>-fig.png", caption: "..." } },
     ],
   }
   ```

6. **Distill, don't dump.** Vault notes are research write-ups; the site is a
   portfolio. Rewrite into 3–4 sections of one tight paragraph each
   (Overview → approach/how it works → 1–2 distinctive aspects → current/
   future work). Keep concrete details that show depth (algorithm names,
   stack choices, numbers); cut headers like "Challenges/What we learned"
   narrative padding. Match the site's voice: first person, confident,
   plain English. Escape apostrophes in JSX (`&apos;`).

7. **Verify before showing the user.** Run `npm run lint` and `npm run build`
   (both must pass — the data is typed, typos in fields fail here). For
   visual confirmation, start the dev server and screenshot the Work grid
   and the new `/project/<slug>` page with Playwright (headless browsers may
   show a video-provider security notice instead of the player — that's the
   provider blocking headless, not a bug).

8. **Commit** with a message describing the added project. Push only if the
   user asks or has an established push-every-change pattern.

## Pitfalls (each of these has actually happened)

- **Asset paths must be absolute** (`/projects/x.png`, `/models/x.obj`).
  Relative paths 404 on the nested `/project/:slug` route.
- The detail-page meta and sections render from typed interfaces
  (`Project`, `ProjectSection` in `site.tsx`) — check the current interface
  before writing; don't invent fields.
- Card grid auto-fits: no CSS changes needed for any project count.
- Obsidian frontmatter `cover` uses wiki-link syntax `"[[file.png]]"` —
  extract the inner filename.
