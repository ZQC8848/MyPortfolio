/**
 * All site copy, links, and project data. Editing content (adding a project,
 * changing the email, rewording a section) should only ever touch this file.
 */

export const site = {
  brand: "◆ QC",
  email: "qinchuan@usc.edu",

  meta: {
    title: "Qinchuan — Portfolio",
    description:
      "Personal portfolio — digital experiences at the edge of code and motion.",
  },

  nav: [
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],

  hero: {
    eyebrow: "Designer · Developer",
    title: (
      <>
        I build digital
        <br />
        experiences at the
        <br />
        edge of <em>code</em> &amp; <em>motion</em>
      </>
    ),
    cta: { label: "View work", href: "#work" },
    scrollHint: "scroll to morph ↓",
  },

  about: {
    index: "01 — About",
    lead: (
      <>
        I design and build interfaces that feel considered, fast, and a little
        unexpected — somewhere between an agency reel and an engineer&apos;s
        attention to detail.
      </>
    ),
    columns: [
      {
        heading: "What I do",
        body: "Frontend engineering, creative WebGL, motion design, and the messy craft of making the two work together at 60fps.",
      },
      {
        heading: "Tools",
        body: "React, TypeScript, Three.js / R3F, GSAP, Lenis, and whatever the idea actually needs.",
      },
    ],
  },

  work: {
    index: "02 — Selected work",
    projects: [
      {
        title: "Project One",
        tag: "WebGL · 2025",
        blurb: "A particle-driven product launch page.",
      },
      {
        title: "Project Two",
        tag: "React · 2025",
        blurb: "Design system and marketing site rebuild.",
      },
      {
        title: "Project Three",
        tag: "Motion · 2024",
        blurb: "Scroll-narrative case study experience.",
      },
      {
        title: "Project Four",
        tag: "Creative · 2024",
        blurb: "Interactive identity for a studio.",
      },
    ],
  },

  contact: {
    index: "03 — Contact",
    lead: (
      <>
        Let&apos;s build
        <br />
        something.
      </>
    ),
    footerNote: "Built with React · Three.js · Lenis",
  },
} as const;
