import { Link, Navigate, useParams } from "react-router-dom";
import { projects, type ProjectVideo } from "../content/site";

function VideoEmbed({ video, title }: { video: ProjectVideo; title: string }) {
  const src =
    video.type === "youtube"
      ? `https://www.youtube.com/embed/${video.id}`
      : `https://player.vimeo.com/video/${video.id}`;
  return (
    <div className="project__video">
      <iframe
        src={src}
        title={`${title} — video`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

export default function Project() {
  const { slug } = useParams();
  const project = projects.find((p) => p.slug === slug);

  if (!project) return <Navigate to="/" replace />;

  return (
    <article className="project">
      <Link className="project__back" to="/#work">
        ← Back to work
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
          </section>
        ))}
      </div>

      <footer className="project__footer">
        <Link to="/#work">← All projects</Link>
      </footer>
    </article>
  );
}
