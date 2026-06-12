import { useState } from "react";
import { Link } from "react-router-dom";
import { projects, site } from "../content/site";

/** Its own section: the non-featured long tail as compact text rows,
 *  collapsed by default behind a toggle. The toggle sits above the list,
 *  so expanding/collapsing never strands the reader. */
export default function Archive() {
  const [open, setOpen] = useState(false);
  const archive = projects.filter((p) => !p.featured);

  return (
    <section className="section archive-section" id="archive">
      <p className="section__index">{site.archive.index}</p>
      <button
        className="work__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide archive ↑" : `View archive (${archive.length}) ↓`}
      </button>
      {open && (
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
    </section>
  );
}
