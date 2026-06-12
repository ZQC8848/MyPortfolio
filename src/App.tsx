import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ScrollProvider, useLenis } from "./lib/ScrollContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Nav from "./components/Nav";
import Home from "./pages/Home";
import Project from "./pages/Project";

// Lazy-loaded so three.js lands in its own chunk and text content paints first.
const ParticleBackground = lazy(() => import("./three/ParticleBackground"));

/** Scrolls to top on route change, or to the anchor when a hash is present. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  const lenisRef = useLenis();

  useEffect(() => {
    const lenis = lenisRef.current;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        if (lenis) lenis.scrollTo(el as HTMLElement);
        else el.scrollIntoView();
        return;
      }
    }
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname, hash, lenisRef]);

  return null;
}

export default function App() {
  return (
    <ScrollProvider>
      <ScrollManager />
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <ParticleBackground />
        </Suspense>
      </ErrorBoundary>
      <Nav />
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:slug" element={<Project />} />
        </Routes>
      </main>
    </ScrollProvider>
  );
}
