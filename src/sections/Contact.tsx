export default function Contact() {
  return (
    <section className="section contact" id="contact">
      <p className="section__index">03 — Contact</p>
      <h2 className="contact__lead">
        Let&apos;s build
        <br />
        something.
      </h2>
      <a className="contact__mail" href="mailto:qinchuan@usc.edu">
        qinchuan@usc.edu
      </a>
      <footer className="contact__footer">
        <span>© {new Date().getFullYear()}</span>
        <span>Built with React · Three.js · GSAP</span>
      </footer>
    </section>
  );
}
