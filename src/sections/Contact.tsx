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
      <footer className="contact__footer">
        <span>
          © {new Date().getFullYear()} {site.fullName}
        </span>
        <span>{contact.footerNote}</span>
      </footer>
    </section>
  );
}
