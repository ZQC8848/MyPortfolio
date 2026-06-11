import SmoothScroll from "./components/SmoothScroll";
import Nav from "./components/Nav";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Work from "./sections/Work";
import Contact from "./sections/Contact";

export default function App() {
  return (
    <SmoothScroll>
      <Nav />
      <main>
        <Hero />
        <About />
        <Work />
        <Contact />
      </main>
    </SmoothScroll>
  );
}
