import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { projects, site } from "../content/site";

/** Min column width in .work__grid (matches minmax(280px, …) in the CSS). */
const CARD_MIN = 280;

/** "Selected Work": featured projects as full cards. Collapsed to a single
 *  row by default; a toggle reveals the rest. */
export default function Work() {
  const featured = projects.filter((p) => p.featured);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(featured.length);
  const [expanded, setExpanded] = useState(false);

  // How many cards fit in one row = the responsive column count. Computed
  // from the grid's real width (deterministic — no dependence on how many
  // cards are currently visible, which auto-fit would otherwise feed back
  // into). Re-measured on resize.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
      const n = Math.floor((grid.clientWidth + gap) / (CARD_MIN + gap));
      setCols(Math.max(1, n));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, []);

  const collapsible = featured.length > cols;
  const visibleCount = !collapsible || expanded ? featured.length : cols;

  return (
    <section className="section work" id="work">
      <p className="section__index">{site.work.index}</p>
      <div className="work__grid" ref={gridRef}>
        {featured.map((p, i) => (
          <Link
            className="card"
            to={`/project/${p.slug}`}
            key={p.slug}
            hidden={i >= visibleCount}
          >
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
      {collapsible && (
        <button
          className="work__toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less ↑" : `Show all ${featured.length} ↓`}
        </button>
      )}
    </section>
  );
}
