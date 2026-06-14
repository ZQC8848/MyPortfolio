import { site } from "../content/site";

export default function Contact() {
  const { contact } = site;
  return (
    <section className="section contact" id="contact">
      <p className="section__index">{contact.index}</p>
      <h2 className="contact__lead">{contact.lead}</h2>
      <a className="contact__mail" href={`mailto:${site.email}`}>
        {site.email}
      </a>
      <div className="contact__socials">
        {contact.socials.map((s) => (
          <a
            key={s.label}
            className="contact__social"
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
          >
            <img className="contact__social-icon" src={s.icon} alt="" />
            <span>{s.label}</span>
          </a>
        ))}
      </div>
      <footer className="contact__footer">
        <span>
          © {new Date().getFullYear()} {site.fullName}
        </span>
        <span>{contact.footerNote}</span>
      </footer>
    </section>
  );
}
