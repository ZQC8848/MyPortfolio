import { Link } from "react-router-dom";
import { site } from "../content/site";

export default function Nav() {
  return (
    <header className="nav">
      <Link className="nav__brand" to="/">
        {site.brand}
      </Link>
      <nav className="nav__links">
        {site.nav.map((l) => (
          <Link key={l.href} to={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
