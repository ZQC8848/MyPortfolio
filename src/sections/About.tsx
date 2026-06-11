import { site } from "../content/site";

export default function About() {
  const { about } = site;
  return (
    <section className="section about" id="about">
      <p className="section__index">{about.index}</p>
      <h2 className="section__lead">{about.lead}</h2>
      <div className="about__cols">
        {about.columns.map((col) => (
          <div key={col.heading}>
            <h3>{col.heading}</h3>
            <p>{col.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
