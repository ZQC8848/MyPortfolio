const projects = [
  { title: "Project One", tag: "WebGL · 2025", blurb: "A particle-driven product launch page." },
  { title: "Project Two", tag: "React · 2025", blurb: "Design system and marketing site rebuild." },
  { title: "Project Three", tag: "Motion · 2024", blurb: "Scroll-narrative case study experience." },
  { title: "Project Four", tag: "Creative · 2024", blurb: "Interactive identity for a studio." },
];

export default function Work() {
  return (
    <section className="section work" id="work">
      <p className="section__index">02 — Selected work</p>
      <ul className="work__list">
        {projects.map((p, i) => (
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
