import { Link } from "react-router-dom";
import { site } from "../content/site";

export default function Hero() {
  const { hero } = site;
  return (
    <section className="hero" id="top">
      <div className="hero__content">
        <p className="hero__eyebrow">{hero.eyebrow}</p>
        <h1 className="hero__title">{hero.title}</h1>
        <Link className="hero__cta" to={hero.cta.href}>
          {hero.cta.label}
        </Link>
      </div>

      <div className="hero__scroll">{hero.scrollHint}</div>
    </section>
  );
}
