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
  {
    slug: "memoirs-barefoot-doctor",
    title: "Memoirs of a Barefoot Doctor",
    tag: "VR Storytelling · Gaussian Splat · 2026",
    blurb:
      "An immersive VR walkthrough of 1960s rural China — AI-generated imagery meets spatial memoir.",
    meta: [
      { label: "Type", value: "VR Storytelling" },
      { label: "Stack", value: "Unity · Gaussian Splatting · AI imagery" },
      { label: "Date", value: "2026 · USC Ganek Expo" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            An immersive VR walkthrough of 1960s rural Chinese villages,
            reconstructing historical scenes with AI-generated imagery and
            Gaussian Splatting. Shown at the USC Ganek Expo.
          </>
        ),
      },
      {
        heading: "Spatial storytelling",
        body: (
          <>
            The project translates a personal memoir into a first-person
            spatial experience — walking the village instead of reading about
            it — fostering cross-cultural empathy and historical reflection.
            Media and full write-up are in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "vr-amblyopia",
    title: "VR Monocular Amblyopia Experience",
    tag: "XR · HCI · 2026",
    blurb:
      "A VR experience that lets sighted people feel how monocular amblyopia changes everyday perception.",
    cover: "/projects/vr-amblyopia.png",
    meta: [
      { label: "Type", value: "XR · HCI" },
      { label: "Date", value: "2026" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            A VR empathy experience simulating how monocular amblyopia
            (lazy eye) alters depth, contrast, and everyday perception —
            built to make an invisible condition tangible for sighted users.
            Full write-up and demo video are in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "vr-soccer",
    title: "Foot-Tracked Multiplayer VR Soccer",
    tag: "MIT Reality Hack · XR · AI · 2026",
    blurb:
      "Foot-tracked, voice-controlled VR football for players with upper-limb disabilities.",
    cover: "/projects/vr-soccer.jpeg",
    video: { type: "vimeo", id: "1158527428" },
    meta: [
      { label: "Type", value: "Accessibility · XR · Game" },
      { label: "Stack", value: "Unity · IMU sensors · UDP · Gemini" },
      { label: "Date", value: "Jan 2026 · MIT Reality Hack" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            A VR football game designed for players with upper-limb
            disabilities, built at MIT Reality Hack: you kick with your real
            feet via IMU-based foot sensors and run the rest of the game with
            your voice. Hands never required.
          </>
        ),
      },
      {
        heading: "Hardware & networking",
        body: (
          <>
            Real-time UDP networking bridges the foot-tracking hardware into
            Unity, and cross-platform multiplayer lets VR players share a
            match with players on flat PCs.
          </>
        ),
      },
      {
        heading: "AI voice control",
        body: (
          <>
            Gemini maps natural-language commands to gameplay actions —
            switching, passing, tactics — so the voice channel acts as a
            full input device rather than a menu shortcut.
          </>
        ),
      },
    ],
  },
  {
    slug: "vr-haptic-research",
    title: "Vibrotactile Texture Perception in VR",
    tag: "Haptics Research · XR · 2026",
    blurb:
      "User study on vibrotactile texture perception — can rumble alone teach your fingers a texture?",
    cover: "/projects/vr-haptic-research.jpeg",
    video: { type: "vimeo", id: "1158598193" },
    meta: [
      { label: "Type", value: "Research · Haptics" },
      { label: "Stack", value: "Quest 3 · Meta Haptic Studio" },
      { label: "Date", value: "2026 · ongoing" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            An ongoing user study (sole author, advised by Prof. Heather
            Culbertson) on how people recognize textures rendered purely as
            controller vibration in VR — comparing absolute identification
            against relative discrimination.
          </>
        ),
      },
      {
        heading: "Method",
        body: (
          <>
            Haptic stimuli are authored in Meta Haptic Studio and paired with
            auditory feedback across three experimental conditions, varying
            how participants are tactilely grounded before each judgment.
          </>
        ),
      },
      {
        heading: "Current work",
        body: (
          <>
            Analyzing recognition accuracy and confidence ratings across
            grounding phases; results are being prepared for publication.
          </>
        ),
      },
    ],
  },
  {
    slug: "convis",
    title: "Convis: Drosophila Neuron Visualization",
    tag: "Three.js · Visualization · 2025",
    blurb:
      "Web-based 3D visualization of fruit-fly neuron morphology for neuroscience teams.",
    meta: [
      { label: "Type", value: "Scientific Visualization" },
      { label: "Stack", value: "Three.js · Web" },
      { label: "Date", value: "2025 · ongoing" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            An interactive web-based 3D tool for exploring the structural
            morphology of fruit-fly (Drosophila) neurons, built with Three.js
            to support neuroscience teams working with fly-brain data.
          </>
        ),
      },
      {
        heading: "Rendering at scale",
        body: (
          <>
            Batch rendering keeps large neuron datasets interactive, with
            real-time controls for filtering and inspecting individual
            structures. Screenshots and a public demo are in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "vision-pro-interaction",
    title: "Vision Pro Interaction",
    tag: "XR · Vision Pro · 2025",
    blurb: "Interaction experiments on Apple Vision Pro.",
    meta: [
      { label: "Type", value: "XR Prototype" },
      { label: "Date", value: "Nov 2025" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            Interaction prototyping on Apple Vision Pro. Full write-up and
            media are in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "earth-shader",
    title: "Earth — Graphic Shader Computing",
    tag: "Computer Graphics · 2025",
    blurb:
      "Rendering Earth from scratch — a C++ ray-tracing and shader computing study.",
    cover: "/projects/earth-shader.jpeg",
    video: { type: "vimeo", id: "1158597091" },
    meta: [
      { label: "Type", value: "Computer Graphics" },
      { label: "Stack", value: "C++ · Ray Tracing · Shaders" },
      { label: "Date", value: "2025" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            A computer-graphics study rendering the Earth with hand-written
            shading and a C++ ray tracer — atmosphere, terrain, and lighting
            computed from first principles rather than engine defaults. The
            demo video shows the result; full write-up is in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "mr-multiplayer-sync",
    title: "Multiplayer Position Sync in MR",
    tag: "MR · Networking · 2025",
    blurb:
      "Keeping multiple headsets spatially aligned in one shared mixed-reality scene.",
    cover: "/projects/mr-multiplayer-sync.png",
    video: { type: "youtube", id: "c415SjI9Jyc" },
    meta: [
      { label: "Type", value: "MR · Networking" },
      { label: "Date", value: "Jun 2025" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            A technical prototype for synchronizing player positions across
            headsets inside a shared mixed-reality scene, so every
            participant sees everyone else exactly where they physically
            stand. Demo in the video; full write-up is in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "mr-wall-broken",
    title: "MR Wall Broken",
    tag: "MR · Quest 3 · 2025",
    blurb:
      "Breaking through your real wall in mixed reality — a portal illusion on scene understanding.",
    cover: "/projects/mr-wall-broken.png",
    video: { type: "youtube", id: "IE5WVtWit7g" },
    meta: [
      { label: "Type", value: "MR Prototype" },
      { label: "Date", value: "Jun 2025" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            A mixed-reality effect that visually breaks open the user&apos;s
            real wall, using scene understanding to anchor the illusion to
            actual room geometry. Demo in the video; full write-up is in
            progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "mr-museum-exhibition",
    title: "MR Exhibition at the National Museum of China",
    tag: "MR · Exhibition · 2025",
    blurb:
      "A mixed-reality exhibition piece deployed on the floor of the National Museum of China.",
    cover: "/projects/mr-museum-exhibition.png",
    video: { type: "youtube", id: "3ph0hPi-SoU" },
    meta: [
      { label: "Type", value: "MR · Production Exhibition" },
      { label: "Date", value: "May 2025" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            A mixed-reality exhibition piece that shipped to a real audience
            on the floor of the National Museum of China — XR built to
            production standards: reliable tracking, unattended operation,
            and visitors who have never worn a headset before.
          </>
        ),
      },
      {
        heading: "More coming",
        body: (
          <>
            The demo video shows the piece in place; a fuller write-up of the
            production process is in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "tunnel-race",
    title: "Tunnel Race",
    tag: "Game · 2025",
    blurb: "A high-speed tunnel racing game.",
    cover: "/projects/tunnel-race.png",
    video: { type: "youtube", id: "QmCvQrmr-aY" },
    meta: [
      { label: "Type", value: "Game" },
      { label: "Date", value: "Mar 2025" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            A high-speed tunnel racing game. Gameplay in the video; full
            write-up is in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "endless-ads",
    title: "Endless ADs",
    tag: "Game · 2024",
    blurb: "A game built around an endless stream of advertising.",
    cover: "/projects/endless-ads.png",
    video: { type: "youtube", id: "Nq3X7G9g3uU" },
    meta: [
      { label: "Type", value: "Game" },
      { label: "Date", value: "Dec 2024" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            A game built around an endless stream of advertising. Gameplay in
            the video; full write-up is in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "angry-bird-ar",
    title: "Angry Bird AR",
    tag: "AR · Game · 2024",
    blurb:
      "The slingshot classic reimagined in AR — flinging birds across your real room.",
    cover: "/projects/angry-bird-ar.png",
    video: { type: "youtube", id: "8Url9hC_uVM" },
    meta: [
      { label: "Type", value: "AR · Game" },
      { label: "Date", value: "Jun 2024" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            A slingshot physics game played in augmented reality, with the
            real room as the level. Demo in the video; full write-up is in
            progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "pig-fighting",
    title: "Pig Fighting",
    tag: "Game · Networking · 2024",
    blurb: "Cross-platform multiplayer battles.",
    cover: "/projects/pig-fighting.png",
    video: { type: "youtube", id: "cwuW3c-GSVw" },
    meta: [
      { label: "Type", value: "Game · Multiplayer" },
      { label: "Date", value: "Jun 2024" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            Cross-platform multiplayer battles. Gameplay in the video; full
            write-up is in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "chinese-abacus-vr-teaching",
    title: "Chinese Abacus VR Teaching",
    tag: "VR · Education · 2024",
    blurb:
      "A VR teaching experience for the traditional Chinese abacus (suanpan).",
    cover: "/projects/chinese-abacus-vr-teaching.png",
    video: { type: "youtube", id: "xO3TpVAirQM" },
    meta: [
      { label: "Type", value: "VR · Education" },
      { label: "Date", value: "Jun 2024" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            A VR experience teaching the traditional Chinese abacus
            (suanpan). Demo in the video; full write-up is in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "end-life",
    title: "END LIFE",
    tag: "Game · 2023",
    blurb: "A student game project — gameplay in the video.",
    cover: "/projects/end-life.png",
    video: { type: "youtube", id: "dALuE3sxA5E" },
    meta: [
      { label: "Type", value: "Game" },
      { label: "Date", value: "May 2023" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            A student game project. Gameplay in the video; full write-up is
            in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "virtual-simulation-lab",
    title: "Virtual Simulation Laboratory",
    tag: "XR · Education · 2023",
    blurb: "A virtual laboratory for hands-on experiments in VR.",
    cover: "/projects/virtual-simulation-lab.png",
    video: { type: "youtube", id: "7vIcb-CrOew" },
    meta: [
      { label: "Type", value: "VR · Education" },
      { label: "Date", value: "Feb 2023" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            A virtual simulation laboratory for hands-on experiments in VR.
            Demo in the video; full write-up is in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "block-splicing",
    title: "Block Splicing",
    tag: "XR · 2022",
    blurb: "An XR block-assembly prototype.",
    cover: "/projects/block-splicing.png",
    video: { type: "youtube", id: "zqs3yucy0R0" },
    meta: [
      { label: "Type", value: "XR Prototype" },
      { label: "Date", value: "Nov 2022" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            An XR prototype about assembling and splicing blocks in space.
            Demo in the video; full write-up is in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "botanical-souls",
    title: "Botanical Souls",
    tag: "XR · Game · 2022",
    blurb: "An XR game about plants — demo in the video.",
    cover: "/projects/botanical-souls.png",
    video: { type: "youtube", id: "TqByPmXqC4M" },
    meta: [
      { label: "Type", value: "XR · Game" },
      { label: "Date", value: "Nov 2022" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            An XR game project themed around botany. Demo in the video; full
            write-up is in progress.
          </>
        ),
      },
    ],
  },
  {
    slug: "air-war",
    title: "AIR War",
    tag: "Game · 2022",
    blurb: "An aerial combat game.",
    cover: "/projects/air-war.png",
    video: { type: "youtube", id: "G3tSm1iuBDw" },
    meta: [
      { label: "Type", value: "Game" },
      { label: "Date", value: "Aug 2022" },
    ],
    sections: [
      {
        heading: "Overview",
        body: (
          <>
            An aerial combat game. Gameplay in the video; full write-up is in
            progress.
          </>
        ),
      },
    ],
  },
];

export const site = {
  brand: "◆ QIN",
  fullName: "Qinchuan Zhang",
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
        Qinchuan
        <br />
        Zhang
      </>
    ),
    tagline: (
      <>
        I build immersive experiences where <em>XR</em>, <em>AI</em> &amp;{" "}
        <em>play</em> converge.
      </>
    ),
    cta: { label: "View work", href: "/#work" },
    scrollHint: "scroll to morph ↓",
  },

  about: {
    index: "01 — About",
    lead: (
      <>
        I build human-centered immersive systems where XR, AI, and game
        design meet.
      </>
    ),
    sub: "M.S. Computer Science at USC · Research Assistant at Ganek Immersive Studio, USC School of Cinematic Arts",
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
