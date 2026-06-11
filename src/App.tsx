import { Suspense } from "react";
import SmoothScroll from "./components/SmoothScroll";
import Nav from "./components/Nav";
import ParticleBackground from "./three/ParticleBackground";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Work from "./sections/Work";
import Contact from "./sections/Contact";

export default function App() {
  return (
    <SmoothScroll>
      <Suspense fallback={null}>
        <ParticleBackground />
      </Suspense>
      <Nav />
      <main className="content">
        <Hero />
        <About />
        <Work />
        <Contact />
      </main>
    </SmoothScroll>
  );
}
