import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import Lenis from "lenis";
import { prefersReducedMotion } from "../config";

interface ScrollState {
  /** Live Lenis instance (null until mounted, or when reduced motion is on). */
  lenisRef: RefObject<Lenis | null>;
  /** Normalized page scroll progress, 0 at top → 1 at bottom. Mutated in
   *  place every scroll frame — read `.current` inside rAF loops, never
   *  treat it as render state. */
  progress: RefObject<number>;
}

const ScrollCtx = createContext<ScrollState | null>(null);

/**
 * Single owner of smooth scrolling and scroll progress for the whole app.
 * Respects prefers-reduced-motion by skipping Lenis entirely and falling
 * back to native scrolling (progress still tracked).
 */
export function ScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const progress = useRef(0);

  useEffect(() => {
    const updateNative = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? window.scrollY / max : 0;
    };

    if (prefersReducedMotion()) {
      updateNative();
      window.addEventListener("scroll", updateNative, { passive: true });
      window.addEventListener("resize", updateNative);
      return () => {
        window.removeEventListener("scroll", updateNative);
        window.removeEventListener("resize", updateNative);
      };
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", () => {
      progress.current = lenis.progress || 0;
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <ScrollCtx.Provider value={{ lenisRef, progress }}>
      {children}
    </ScrollCtx.Provider>
  );
}

/** Scroll progress ref (0–1). Read `.current` per frame; never in render. */
export function useScrollProgress(): RefObject<number> {
  const ctx = useContext(ScrollCtx);
  if (!ctx) throw new Error("useScrollProgress requires <ScrollProvider>");
  return ctx.progress;
}

/** Access the Lenis instance (e.g. to wire up GSAP ScrollTrigger later). */
export function useLenis(): RefObject<Lenis | null> {
  const ctx = useContext(ScrollCtx);
  if (!ctx) throw new Error("useLenis requires <ScrollProvider>");
  return ctx.lenisRef;
}
