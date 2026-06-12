import { useState } from "react";
import { Link } from "react-router-dom";
import { projects, site } from "../content/site";

/**
 * Two tiers: featured projects render as full cards ("Selected Work"),
 * everything else lives in a compact archive list, collapsed by default.
 * The toggle sits above the list, so collapsing never strands the reader.
 */
export default function Work() {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const featured = projects.filter((p) => p.featured);
  const archive = projects.filter((p) => !p.featured);

  return (
    <section className="section work" id="work">
      <p className="section__index">{site.work.index}</p>
      <div className="work__grid">
        {featured.map((p, i) => (
          <Link className="card" to={`/project/${p.slug}`} key={p.slug}>
            <div className="card__media">
              {p.cover ? (
                <img src={p.cover} alt={p.title} loading="lazy" />
              ) : (
                <div className="card__placeholder" aria-hidden>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                </div>
              )}
            </div>
            <div className="card__body">
              <h3 className="card__title">{p.title}</h3>
              <p className="card__blurb">{p.blurb}</p>
              <span className="card__tag">{p.tag}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="work__archive">
        <button
          className="work__toggle"
          aria-expanded={archiveOpen}
          onClick={() => setArchiveOpen((v) => !v)}
        >
          {archiveOpen
            ? "Hide archive ↑"
            : `View archive (${archive.length}) ↓`}
        </button>
        {archiveOpen && (
          <ul className="archive">
            {archive.map((p) => (
              <li key={p.slug}>
                <Link className="archive__row" to={`/project/${p.slug}`}>
                  <span className="archive__title">{p.title}</span>
                  <span className="archive__tag">{p.tag}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
