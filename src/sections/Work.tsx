import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projects, site } from "../content/site";
import { MOBILE_BREAKPOINT } from "../config";
import { useLenis } from "../lib/ScrollContext";

/** Cards shown while the grid is collapsed. */
const PREVIEW_DESKTOP = 6;
const PREVIEW_MOBILE = 3;

/** Live (listener-backed) version of the 768px breakpoint check. */
function useIsMobile() {
  const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
  const [mobile, setMobile] = useState(
    () => window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return mobile;
}

export default function Work() {
  const [expanded, setExpanded] = useState(false);
  const lenisRef = useLenis();
  const preview = useIsMobile() ? PREVIEW_MOBILE : PREVIEW_DESKTOP;
  const visible = expanded ? projects : projects.slice(0, preview);

  const toggle = () => {
    if (!expanded) {
      setExpanded(true);
      return;
    }
    // Collapsing removes most of the grid under the reader's feet — bring
    // them back to the top of the section instead of stranding them at
    // whatever now occupies that scroll position. The section's own top
    // doesn't move, so scrolling before the re-render lands correctly.
    setExpanded(false);
    const el = document.querySelector("#work");
    const lenis = lenisRef.current;
    if (el) {
      if (lenis) lenis.scrollTo(el as HTMLElement);
      else el.scrollIntoView();
    }
  };

  return (
    <section className="section work" id="work">
      <p className="section__index">{site.work.index}</p>
      <div className="work__grid">
        {visible.map((p, i) => (
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
      {projects.length > preview && (
        <button
          className="work__toggle"
          aria-expanded={expanded}
          onClick={toggle}
        >
          {expanded
            ? "Show fewer ↑"
            : `View all ${projects.length} projects ↓`}
        </button>
      )}
    </section>
  );
}
