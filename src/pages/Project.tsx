import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { projects, type ProjectVideo } from "../content/site";

function embedSrc(video: ProjectVideo): string {
  switch (video.type) {
    case "youtube":
      return `https://www.youtube.com/embed/${video.id}`;
    case "vimeo":
      return `https://player.vimeo.com/video/${video.id}`;
    case "slides":
      return `https://docs.google.com/presentation/d/${video.id}/embed`;
  }
}

function VideoEmbed({ video, title }: { video: ProjectVideo; title: string }) {
  return (
    <div className="project__video">
      <iframe
        src={embedSrc(video)}
        title={`${title} — ${video.type === "slides" ? "slides" : "video"}`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

export default function Project() {
  const { slug } = useParams();
  const location = useLocation();
  const project = projects.find((p) => p.slug === slug);

  if (!project) return <Navigate to="/" replace />;

  // Return to whichever section the visitor came from, so the home page
  // scrolls back to (and re-reveals) the list they were browsing.
  const from = (location.state as { from?: string } | null)?.from;
  const backHash = from === "archive" ? "/#archive" : "/#work";
  const backLabel = from === "archive" ? "← Back to archive" : "← Back to work";

  return (
    <article className="project">
      <Link className="project__back" to={backHash}>
        {backLabel}
      </Link>

      <header className="project__head">
        <p className="section__index">{project.tag}</p>
        <h1 className="project__title">{project.title}</h1>
        <dl className="project__meta">
          {project.meta.map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {project.video ? (
        <VideoEmbed video={project.video} title={project.title} />
      ) : (
        project.cover && (
          <img
            className="project__hero-img"
            src={project.cover}
            alt={project.title}
          />
        )
      )}

      <div className="project__sections">
        {project.sections.map((s) => (
          <section className="project__section" key={s.heading}>
            <h2>{s.heading}</h2>
            <p>{s.body}</p>
            {s.image && (
              <figure>
                <img src={s.image.src} alt={s.image.caption} loading="lazy" />
                <figcaption>{s.image.caption}</figcaption>
              </figure>
            )}
            {s.images && (
              <div className="project__gallery">
                {s.images.map((img) => (
                  <figure key={img.src}>
                    <img src={img.src} alt={img.caption} loading="lazy" />
                    <figcaption>{img.caption}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <footer className="project__footer">
        <Link to={backHash}>← All projects</Link>
      </footer>
    </article>
  );
}
