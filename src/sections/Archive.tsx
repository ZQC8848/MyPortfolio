import { Link } from "react-router-dom";
import { projects, site } from "../content/site";
import { useSessionState } from "../lib/useSessionState";

/** How many rows to show before the list is expanded. */
const PREVIEW_COUNT = 4;

/** Its own section: the non-featured long tail as compact text rows.
 *  A preview of the first few rows is always visible; a toggle below the
 *  list reveals the rest. */
export default function Archive() {
  const [expanded, setExpanded] = useSessionState("archive-expanded", false);
  // The archive is the long tail — featured projects already live in
  // Selected Work, so exclude them here to avoid repeats.
  const archive = projects.filter((p) => !p.featured);
  const collapsible = archive.length > PREVIEW_COUNT;
  const visibleCount = !collapsible || expanded ? archive.length : PREVIEW_COUNT;

  return (
    <section className="section archive-section" id="archive">
      <p className="section__index">{site.archive.index}</p>
      <ul className="archive">
        {archive.map((p, i) => (
          <li key={p.slug} hidden={i >= visibleCount}>
            <Link
              className="archive__row"
              to={`/project/${p.slug}`}
              state={{ from: "archive" }}
            >
              <span className="archive__head">
                <span className="archive__title">{p.title}</span>
                <span className="archive__tag">{p.tag}</span>
              </span>
              <span className="archive__desc">{p.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
      {collapsible && (
        <button
          className="work__toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less ↑" : `View archive (${archive.length}) ↓`}
        </button>
      )}
    </section>
  );
}
