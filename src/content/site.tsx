import type { ReactNode } from "react";

/**
 * All site copy, links, and project data. Editing content (adding a project,
 * changing the email, rewording a section) should only ever touch this file.
 *
 * Project descriptions are distilled from the Obsidian vault notes
 * (Projects/Featured Projects + Projects/Call Me Merlin).
 */

export interface ProjectVideo {
  type: "youtube" | "vimeo";
  id: string;
}

export interface ProjectSection {
  heading: string;
  body: ReactNode;
  image?: { src: string; caption: string };
}

export interface Project {
  slug: string;
  title: string;
  tag: string;
  blurb: string;
  /** Card/detail cover image; omit to use a gradient placeholder card. */
  cover?: string;
  video?: ProjectVideo;
  meta: { label: string; value: string }[];
  sections: ProjectSection[];
}

export const projects: Project[] = [
  {
    slug: "syncscape",
    title: "SyncScape",
    tag: "Gaussian Splat · HCI · 2026",
    blurb:
      "Aligning AI-generated virtual rooms with physical space in MR — walk freely, no motion sickness.",
    cover: "/projects/syncscape.png",
    video: { type: "vimeo", id: "1168772748" },
    meta: [
      { label: "Type", value: "Research · XR" },
      { label: "Stack", value: "Quest 3 · Unity MRUK · WorldLabs · Open3D" },
      { label: "Date", value: "2026" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            SyncScape is an application framework that seamlessly bridges the
            virtual and real worlds in Mixed Reality. The system reconstructs
            the user&apos;s physical room as a stylized virtual environment
            inside the headset while maintaining spatial congruence between
            virtual and real objects — users can walk freely without colliding
            with physical obstacles, and because visual movement stays
            consistent with physical motion, vestibular–visual conflict and
            motion sickness are significantly reduced.
          </>
        ),
      },
      {
        heading: "How it works",
        body: (
          <>
            The room is captured with Quest 3&apos;s spatial scanning, then
            semantically abstracted in Unity: MRUK effect meshes cover every
            real object&apos;s bounding box with uniform white material,
            keeping geometry but stripping semantics. A panoramic capture of
            this abstract layout is sent to the WorldLabs model with a text
            prompt, which generates a stylized Gaussian Splatting room that
            preserves the identical spatial layout.
          </>
        ),
        image: {
          src: "/projects/syncscape-pano.png",
          caption: "Panoramic input of the abstracted room layout",
        },
      },
      {
        heading: "Automatic alignment",
        body: (
          <>
            Point clouds are sampled from both the real-world bounding-box
            surfaces and the AI-generated splat scene, and a rigid
            transformation is computed with Open3D to register the virtual
            room against the physical environment. A hand-tracked refinement
            pass follows: single-hand pinch translates the room, bimanual
            pinch adjusts rotation and scale, with scene opacity dropped to
            30% for precise visual registration.
          </>
        ),
        image: {
          src: "/projects/syncscape-align.png",
          caption: "Point cloud alignment between real and generated scenes",
        },
      },
      {
        heading: "Current research",
        body: (
          <>
            Uniform surface sampling biases alignment because generated scenes
            are noisy in occluded regions and drift far from the capture
            camera. Ongoing work replaces it with camera-centric 360° ray
            sampling plus distance/occlusion-weighted matching, panoramic
            feature matching, and semantic color-coding of the model input.
            Next steps: Vision Pro support, dynamic object representation,
            outdoor scenes, and user studies for gaming, education, and
            therapy.
          </>
        ),
        image: {
          src: "/projects/syncscape-preview.png",
          caption: "Alignment preview — yellow: source, cyan: target",
        },
      },
    ],
  },
  {
    slug: "handspeaker",
    title: "HandSpeaker",
    tag: "HCI · ML · Hardware · XR",
    blurb:
      "Real-time sign language translation on AR glasses — understanding motion as language.",
    cover: "/projects/handspeaker.png",
    video: { type: "youtube", id: "TrCdpxfqvkI" },
    meta: [
      { label: "Type", value: "Research · HCI" },
      { label: "Stack", value: "AR Spectacles · Hand Tracking · WebSocket" },
      { label: "Focus", value: "Spatiotemporal gesture understanding" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            Sign language is inherently spatiotemporal — meaning depends not
            just on hand shape but on motion, trajectory, and timing. Most
            digital solutions stop at static gesture classification.
            HandSpeaker is a real-time sign language translation system built
            on AR hand tracking that treats recognition as a sequence problem:
            understanding motion as language.
          </>
        ),
      },
      {
        heading: "How it works",
        body: (
          <>
            Instead of RGB images or depth sensors, the system operates
            directly on 3D hand joint transforms streamed from AR Spectacles.
            Motion is decomposed into spatial features (joint positions),
            motion features (trajectory and velocity), and structural features
            (joint angles). Static and dynamic gestures are unified as
            temporal sequences — short for poses, longer for trajectories —
            classified by a lightweight pipeline and pushed over WebSocket to
            text and speech output with demo-grade latency.
          </>
        ),
      },
      {
        heading: "Data pipeline",
        body: (
          <>
            No dataset exists for 3D hand-joint trajectories, so the project
            includes its own: trigger-based 3-second recordings flow through
            upload, timeline playback, manual labeling, and dataset
            management in a web interface — turning every user interaction
            into training-ready data for the next stage: LSTM/Transformer
            models, sentence-level translation, and continuous unsegmented
            signing.
          </>
        ),
      },
    ],
  },
  {
    slug: "call-me-merlin",
    title: "Call Me Merlin",
    tag: "Multiplayer VR · Unity 6 · 2026",
    blurb:
      "Networked VR spell-casting with bare hands — draw shapes in the air, cast synchronized magic.",
    video: undefined,
    meta: [
      { label: "Team", value: "Qinchuan Zhang · Weibo Xu" },
      { label: "Stack", value: "Unity 6 · Photon Fusion 2 · XR Hands" },
      { label: "Date", value: "May 2026" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            Hand tracking ships on millions of headsets, yet multiplayer VR
            still defaults to controllers. Call Me Merlin closes that gap: a
            peer-to-peer VR battle where players cast spells by drawing
            magic-circle shapes in the air with bare hands — and every
            trajectory, circle, and spell effect stays synchronized across
            clients in real time.
          </>
        ),
      },
      {
        heading: "Gesture recognition",
        body: (
          <>
            Index-fingertip trajectories are projected to a head-relative 2D
            plane, Gaussian-filtered to remove hand tremor, sparsified, and
            segmented by directional deviation — then classified against 17
            gesture templates in the spirit of the $1/Protractor recognizers.
            Shapes map to elements: circles to fire, lines to wind, triangles
            to water, squares to earth.
          </>
        ),
      },
      {
        heading: "Two-phase interaction",
        body: (
          <>
            Casting is split into two phases to prevent accidental triggers:
            draw a shape to load an element (a world-anchored magic circle
            confirms it), then strike a hand pose to fire — gun-point for
            projectile, open palm for blast, double thumbs-up for a sustained
            beam, double fist for shield. Four mechanics × four elements
            yield sixteen visual variants.
          </>
        ),
      },
      {
        heading: "Networked architecture",
        body: (
          <>
            A strict four-layer pipeline (perception → routing → trigger →
            effect) keeps the system extensible — adding a spell never touches
            perception or effect code. Photon Fusion 2 in shared mode
            synchronizes trajectories via RPCs and gesture state via
            [Networked] properties, while VFX spawn as network objects so
            visuals and spatial audio stay consistent on every client without
            extra round-trips.
          </>
        ),
      },
    ],
  },
];

export const site = {
  brand: "◆ QIN",
  email: "qinchuan@usc.edu",

  meta: {
    title: "Qinchuan Zhang — Portfolio",
    description:
      "Qinchuan (Qin) Zhang — XR, AI & game developer. M.S. Computer Science at USC, Research Assistant at Ganek Immersive Studio. Immersive experiences where XR, AI & play converge.",
  },

  nav: [
    { label: "Work", href: "/#work" },
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
  ],

  hero: {
    eyebrow: "XR · AI · Game Developer",
    title: (
      <>
        I build immersive
        <br />
        experiences where
        <br />
        <em>XR</em>, <em>AI</em> &amp; <em>play</em> converge
      </>
    ),
    cta: { label: "View work", href: "/#work" },
    scrollHint: "scroll to morph ↓",
  },

  about: {
    index: "01 — About",
    lead: (
      <>
        I&apos;m Qin — an M.S. Computer Science student at USC and Research
        Assistant at the Ganek Immersive Studio (USC School of Cinematic
        Arts), where I also collaborate with Dolby on volumetric video
        playback. I build human-centered immersive systems where XR, AI, and
        game design meet.
      </>
    ),
    columns: [
      {
        heading: "XR",
        body: "VR, MR, and AR across Quest 3, Vision Pro, and AR Spectacles — spatial alignment between virtual and real, hand-tracked interaction, haptics research, and multiplayer presence that holds up outside the lab.",
      },
      {
        heading: "AI",
        body: "Generative worlds and narrative: Gaussian Splatting world models that restyle real rooms, real-time sign-language recognition, voice-controlled gameplay — and LLM-driven interactive drama in VR as my current research focus.",
      },
      {
        heading: "Game",
        body: "Gameplay engineering and networked multiplayer in Unity and Unreal — spells cast by hand-drawn gestures, football played with foot trackers — built fast at hackathons like MIT Reality Hack and polished for the expo floor.",
      },
    ],
  },

  work: {
    index: "02 — Selected work",
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
