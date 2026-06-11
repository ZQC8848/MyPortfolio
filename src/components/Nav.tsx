import { site } from "../content/site";

export default function Nav() {
  return (
    <header className="nav">
      <a className="nav__brand" href="#top">
        {site.brand}
      </a>
      <nav className="nav__links">
        {site.nav.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
