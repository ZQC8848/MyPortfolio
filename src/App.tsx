import { lazy, Suspense } from "react";
import { ScrollProvider } from "./lib/ScrollContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Nav from "./components/Nav";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Work from "./sections/Work";
import Contact from "./sections/Contact";

// Lazy-loaded so three.js lands in its own chunk and text content paints first.
const ParticleBackground = lazy(() => import("./three/ParticleBackground"));

export default function App() {
  return (
    <ScrollProvider>
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <ParticleBackground />
        </Suspense>
      </ErrorBoundary>
      <Nav />
      <main className="content">
        <Hero />
        <About />
        <Work />
        <Contact />
      </main>
    </ScrollProvider>
  );
}
