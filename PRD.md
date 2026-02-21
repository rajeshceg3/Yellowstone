
---

YELLOWSTONE SANCTUARY

A living, breathing geothermal wilderness rendered in Three.js


---

Core Vision

Create a web-based interactive sanctuary inspired by
Yellowstone National Park

Not as a documentary.
Not as a game.

But as a slow, contemplative drift through geothermal earth, mist, wildlife, and silence.

This experience should feel like:

> Standing on fragile ground above ancient heat
Watching steam rise into cold morning light
Feeling small in the presence of something immense




---

🌋 Core Experience Requirements

1️⃣ Five Distinct Geothermal Realms

Each realm is its own explorable 3D space:

1. Geyser Basin – Steam columns, mineral terraces, rhythmic eruptions


2. Prismatic Spring Field – Iridescent thermal pools, microbial color gradients


3. Grand Canyon of Yellowstone – Golden cliffs, distant waterfalls, rising mist


4. Lamar Valley – Open plains, slow-moving bison herds, wolf silhouettes


5. Volcanic Caldera Depth – Subtle glowing magma fissures beneath translucent crust



Each realm transitions fluidly — no cuts, no loading screens.


---

🎨 Visual Language (Non-Negotiable)

Color Philosophy

Soft, atmospheric, emotionally restrained.

Geyser Basin → Warm whites, mineral pastels, diffused steam light

Prismatic Springs → Turquoise core, amber and rust gradients

Canyon → Golden ochres, cool mist blues

Valley → Muted sage, early-morning haze

Caldera Depth → Dim ambers, volcanic glow through fog


Avoid:

Harsh contrast

Aggressive bloom

Sharp, synthetic highlights


Use:

Volumetric fog

Soft light shafts

Depth gradients

Slow ambient particle drift


Light should feel like breath.


---

🐾 Indigenous Life Integration

Each region includes 3–5 native species.

Geyser Basin

Raven silhouettes

Elk at distant tree line

Steam insects (stylized, subtle)


Prismatic Field

Minimal fauna — focus on microbial color life

Occasional distant bison form


Canyon

Bald eagles gliding slowly

Subtle fish shimmer in river below


Lamar Valley

Hero creature: American Bison

Wolves in distant formation

Pronghorn silhouettes


Caldera Depth

No animals.

Only Earth.


Stillness is the inhabitant.


---

🌬️ Motion Philosophy

All movement must feel:

Slow

Weighted

Unhurried


Camera drift = floating, not flying
Animal motion = deliberate, grounded
Steam = rising with variation, never looping mechanically

No sudden acceleration.


---

🎮 Interaction Model

There is no objective.

There is only presence.

Users may:

Drift across thermal plains

Approach steam vents

Descend gently into caldera depth

Pause and observe wildlife


Micro-interactions:

Steam thickens when approached

Bison lift their heads, then return to grazing

Wolves shift formation subtly

Water ripples gently when hovered


No sound spikes. No alerts.


---

🔄 Realm Transitions

Transitions should feel geological, not digital.

Example:

Geyser Basin → Prismatic Field
Steam thickens → colors bleed into mineral gradients → camera lowers → spring emerges.

Valley → Caldera
Ground slowly becomes semi-translucent → glow emerges beneath → user descends.

No fades to black.

Everything morphs.


---

🔊 Audio Design

Spatial, minimal, deeply ambient.

Low geothermal rumble (sub-bass)

Wind across plains

Distant animal calls

Steam vent exhale rhythm


Audio should feel like:

> The Earth breathing slowly



No narration. No music score. Only environmental tone.


---

🧭 UI Philosophy

Minimal.

Soft region name fades in once upon entry

Subtle compass glyph in corner

Dissolves after inactivity


No menus floating in space.

Navigation feels discoverable, not instructed.


---

🧠 Emotional Objective

Every design decision must answer:

> Does this reduce tension, or add it?



If it feels impressive but not peaceful — remove it.

If it feels technically clever but emotionally loud — simplify it.


---

⚙️ Technical Direction

Core Stack

Rendering → Three.js (WebGL)
Animation → GSAP + custom shader animation
State → Lightweight scene manager
UI → Tailwind CSS overlays (minimal only)
Audio → Web Audio API with positional audio


---

Performance Constraints

Must run smoothly on mid-range mobile

Use instancing for wildlife

Shader-driven steam instead of particle-heavy systems

Compressed textures

LOD transitions invisible


60fps target.

Graceful degradation if necessary.


---

🧊 Interaction Tone

No score.
No achievements.
No instructions overlay.

The experience is complete the moment the user slows down.


---

🌄 Success Criteria

The sanctuary succeeds if:

A user understands how to move within seconds

They linger without noticing time passing

They describe it as:

“Grounded”

“Peaceful”

“Immense”

“Alive”




---

🕊 Creative Constraint (Critical)

This is not a wildlife simulator.
This is not a volcanic disaster demo.
This is not a travel brochure.

It is:

Light across mineral water.
Steam against cold sky.
Hoofbeats on open land.
Ancient heat beneath fragile crust.

Rendered in Three.js.
Guided by restraint.
Shaped by empathy.
