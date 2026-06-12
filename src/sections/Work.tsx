import { Link } from "react-router-dom";
import { projects, site } from "../content/site";

export default function Work() {
  return (
    <section className="section work" id="work">
      <p className="section__index">{site.work.index}</p>
      <div className="work__grid">
        {projects.map((p, i) => (
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
    </section>
  );
}
