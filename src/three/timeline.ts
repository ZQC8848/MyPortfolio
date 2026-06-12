import { SHAPE_KEYFRAMES, isMobileViewport } from "../config";

export type Vec3 = readonly [number, number, number];

/** One point on the resolved timeline: progress `at` shows keyframe `kf`. */
export interface TimelineStop {
  at: number;
  kf: number;
}
export interface Timeline {
  stops: TimelineStop[];
  offsets: Vec3[];
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/**
 * Pure layout pass — no DOM access, unit-testable. Takes each keyframe's
 * measured `enter` progress (null = unanchored, to be spaced automatically)
 * plus per-keyframe holds, and returns the flattened stop list: each
 * keyframe becomes an [enter, exit] pair — the shape is fully formed at
 * `enter` and starts dissolving at `exit = enter + hold`.
 *
 * Unanchored endpoints hold at the page edges; unanchored middles split the
 * gap between their resolved neighbours into equal morph transitions,
 * reserving room for holds. The result is forced non-decreasing (anchors
 * can land out of order).
 */
export function layoutTimeline(
  measured: readonly (number | null)[],
  holds: readonly number[]
): TimelineStop[] {
  const n = measured.length;
  const enter: (number | null)[] = [...measured];
  const exit: (number | null)[] = enter.map((e, i) =>
    e === null ? null : e + holds[i]
  );

  if (enter[0] === null) {
    enter[0] = 0;
    exit[0] = holds[0];
  }
  if (enter[n - 1] === null) {
    exit[n - 1] = 1;
    enter[n - 1] = 1 - holds[n - 1];
  }
  for (let i = 1; i < n - 1; i++) {
    if (enter[i] !== null) continue;
    let j = i + 1;
    while (enter[j] === null) j++;
    let holdSum = 0;
    for (let k = i; k < j; k++) holdSum += holds[k];
    const gap = enter[j]! - exit[i - 1]!;
    const morph = Math.max(gap - holdSum, 0) / (j - i + 1);
    let cursor = exit[i - 1]!;
    for (let k = i; k < j; k++) {
      enter[k] = cursor + morph;
      exit[k] = enter[k]! + holds[k];
      cursor = exit[k]!;
    }
  }

  const stops: TimelineStop[] = [];
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const e0 = Math.max(enter[i]!, prev);
    const e1 = Math.max(exit[i]!, e0);
    stops.push({ at: e0, kf: i }, { at: e1, kf: i });
    prev = e1;
  }
  return stops;
}

/** Dev aid: report each missing anchor once, not on every re-measure. */
const warnedAnchors = new Set<string>();

/**
 * Resolve the morph timeline for the CURRENT layout. Anchored keyframes
 * measure their `enter` from the element's real document position (correct
 * on any viewport width); the pure layout pass above spaces the rest. If
 * any anchored element is missing (e.g. on /project/:slug), the page
 * doesn't have the sections this timeline is choreographed around, so the
 * background falls back to a static explode scatter.
 */
export function resolveTimeline(): Timeline {
  const kfs = SHAPE_KEYFRAMES;
  const mobile = isMobileViewport();
  const offsets = kfs.map<Vec3>(
    (kf) => (mobile ? kf.offsetMobile ?? kf.offset : kf.offset) ?? [0, 0, 0]
  );
  const holds = kfs.map((kf) => kf.hold ?? 0);
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  const fallback = (): Timeline => {
    const e = Math.max(kfs.findIndex((k) => k.shape === "explode"), 0);
    return {
      stops: [
        { at: 0, kf: e },
        { at: 1, kf: e },
      ],
      offsets,
    };
  };

  const measured: (number | null)[] = new Array(kfs.length).fill(null);
  for (let i = 0; i < kfs.length; i++) {
    const sel = kfs[i].anchor;
    if (!sel) continue;
    const el = document.querySelector(sel);
    if (!el) {
      if (import.meta.env.DEV && !warnedAnchors.has(sel)) {
        warnedAnchors.add(sel);
        console.info(
          `[particles] anchor "${sel}" not found — falling back to the explode-only background ` +
            `(expected on pages without that section; a typo in SHAPE_KEYFRAMES would look the same)`
        );
      }
      return fallback();
    }
    if (maxScroll <= 0) return fallback();
    const top = el.getBoundingClientRect().top + window.scrollY;
    const target = top - (kfs[i].anchorViewport ?? 0.1) * window.innerHeight;
    measured[i] = clamp01(target / maxScroll);
  }

  return { stops: layoutTimeline(measured, holds), offsets };
}
