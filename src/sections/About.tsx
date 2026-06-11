export default function About() {
  return (
    <section className="section about" id="about">
      <p className="section__index">01 — About</p>
      <h2 className="section__lead">
        I design and build interfaces that feel considered, fast, and a little
        unexpected — somewhere between an agency reel and an engineer&apos;s
        attention to detail.
      </h2>
      <div className="about__cols">
        <div>
          <h3>What I do</h3>
          <p>
            Frontend engineering, creative WebGL, motion design, and the messy
            craft of making the two work together at 60fps.
          </p>
        </div>
        <div>
          <h3>Tools</h3>
          <p>React, TypeScript, Three.js / R3F, GSAP, Lenis, and whatever the
            idea actually needs.</p>
        </div>
      </div>
    </section>
  );
}
