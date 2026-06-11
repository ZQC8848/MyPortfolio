/**
 * All site copy, links, and project data. Editing content (adding a project,
 * changing the email, rewording a section) should only ever touch this file.
 */

export const site = {
  brand: "◆ QIN",
  email: "qinchuan@usc.edu",

  meta: {
    title: "Qinchuan Zhang — Portfolio",
    description:
      "Qinchuan (Qin) Zhang — VR & game developer. M.S. Computer Science (Game Development) at USC. Immersive experiences at the edge of virtual and real.",
  },

  nav: [
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],

  hero: {
    eyebrow: "VR · Game Developer",
    title: (
      <>
        I build immersive
        <br />
        experiences at the
        <br />
        edge of <em>virtual</em> &amp; <em>real</em>
      </>
    ),
    cta: { label: "View work", href: "#work" },
    scrollHint: "scroll to morph ↓",
  },

  about: {
    index: "01 — About",
    lead: (
      <>
        I&apos;m Qin — an M.S. Computer Science student at USC specializing in
        game development, building VR, MR, and game experiences from research
        prototypes to a national museum floor.
      </>
    ),
    columns: [
      {
        heading: "What I do",
        body: "VR/MR/AR development, gameplay engineering, and HCI research — from Gaussian Splatting and haptics to multiplayer systems that hold up outside the lab.",
      },
      {
        heading: "Tools",
        body: "Unity & C#, Gaussian Splatting, OpenXR / Quest / Vision Pro, networking, shaders, and whatever the prototype actually needs.",
      },
      {
        heading: "Background",
        body: "M.S. CS (Game Development) at USC, 2025–present. B.E. Digital Media & Technology. Previously Unity Developer Intern at Virtual Origin; Technical Planning at JoyCastle.",
      },
    ],
  },

  work: {
    index: "02 — Selected work",
    projects: [
      {
        title: "SyncScape",
        tag: "Gaussian Splat · HCI · 2026",
        blurb:
          "Research on aligning virtual and real spaces in VR using Gaussian Splatting.",
      },
      {
        title: "MR Exhibition — National Museum of China",
        tag: "Mixed Reality · 2025",
        blurb:
          "Mixed-reality exhibition experience deployed on the museum floor.",
      },
      {
        title: "HandSpeaker",
        tag: "HCI · ML · Hardware · XR",
        blurb:
          "Research combining machine learning and custom hardware for hand-based communication in XR.",
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
