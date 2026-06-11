import { site } from "../content/site";

export default function Work() {
  const { work } = site;
  return (
    <section className="section work" id="work">
      <p className="section__index">{work.index}</p>
      <ul className="work__list">
        {work.projects.map((p, i) => (
          <li className="work__item" key={p.title}>
            <span className="work__num">{String(i + 1).padStart(2, "0")}</span>
            <span className="work__title">{p.title}</span>
            <span className="work__blurb">{p.blurb}</span>
            <span className="work__tag">{p.tag}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
