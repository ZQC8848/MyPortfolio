import { Suspense } from "react";
import ParticleMorph from "../three/ParticleMorph";

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__canvas">
        <Suspense fallback={null}>
          <ParticleMorph />
        </Suspense>
      </div>

      <div className="hero__content">
        <p className="hero__eyebrow">Designer · Developer</p>
        <h1 className="hero__title">
          I build digital
          <br />
          experiences at the
          <br />
          edge of <em>code</em> &amp; <em>motion</em>
        </h1>
        <a className="hero__cta" href="#work">
          View work
        </a>
      </div>

      <div className="hero__scroll">scroll ↓</div>
    </section>
  );
}
