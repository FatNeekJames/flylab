# FlyLab

[Play FlyLab](https://fatneekjames.github.io/flylab/) · [GitHub repository](https://github.com/FatNeekJames/flylab)

An interactive 3D recreation inspired by the supplied fly bench-press video. Built with Three.js and vanilla JavaScript. All assets are procedural and run locally; no API keys are needed.

## Run

Install Node.js, then run:

    npm install
    npm start

Open http://localhost:5173. If the port is occupied, set the PORT environment variable to another port before starting.

## Controls

- Add paired plates, use the slider, type a load, or press + / − to change weight (20–500 lb).
- Start lifting repeats until the fly stalls or you rack the bar.
- One-rep max attempts one rep at the selected weight, then automatically racks.
- Hold Space or the on-screen push button for extra strength at the cost of faster fatigue.
- Rest restores energy. Failed lifts stop on the safety arms.
- Drag the scene to orbit; scroll to zoom. Perspective, Side, and Front set camera views.
- Sound is opt-in. Personal best persists in this browser; Reset session clears it.

The fatigue/strength rules and brain/activity displays are game mechanics, not biological measurements. The 3D model is a procedural approximation of the video, not its original assets or simulator.

## Check

    npm test

The engine tests cover reps, one-rep mode, fatigue, recovery, effort boosts, load limits, mid-rep overload, and reset.

## Anatomy explorer and rack motion

The brain panel now includes a rotatable anatomical schematic, selectable regions, live-spike/cell-color modes, a rolling spike raster and press/lower/hold readouts. See [RESEARCH.md](RESEARCH.md) for primary sources, model design and limits. Its 384 model units are separate from the 139,255-neuron FlyWire reference dataset. The ventral nerve cord is shown in a body inset, outside the brain.

The lowered rack uses a continuous lift/back/settle motion and fixed-length gripping limbs. Failed lifts rest on the safety arms; returning a failed bar uses a visibly labeled rack assist.

## Publish

`npm run build` creates the self-contained static site in `dist/`. Pushes to `main` run the tests and deploy this folder through GitHub Actions to GitHub Pages. The production import map uses bundled Three.js files, so no CDN or server is needed. Reference media, dependencies and build output are excluded from Git.

## Train, think and recover

Manual mode remains the default. The original load, lifting, push, one-rep max and rack controls retain their original mechanics. A manual rep also contributes a small amount of bench mastery without changing strength or energy rules. Select a skill and run a single session to try the new activities, or choose **Autonomous** and let the fly choose sessions by need. The library shows every need score, current energy cost and mastery; the current session explains its choice. A nudge requests the next feasible session, without interrupting the current one.

The twelve modules cover bench press, chest flies, Stairmaster, marathon training, swimming, blackjack, poker, PhD studies, yoga/stretching, chess, cooking and rest/sleep. These are animated practice sessions, not full card-game or academic simulators. Card activities involve no money or betting.

Repeated practice reduces session energy cost toward a nonzero 25% floor. Yoga mastery reduces fatigue from other physical activities by up to 30%; cooking mastery accelerates rest recovery by up to 60%. PhD mastery grows much more slowly than chess or poker. Small changes to the existing thorax, abdomen and limb thickness reflect cumulative mastery across every practiced skill, including mental activities. These are game mechanics, not biological measurements.

A timer independent of rendering advances sessions at **one real second per simulated minute**. Energy and fatigue change throughout sessions; mastery is awarded on completion. Autonomous scheduling chooses the highest eligible need at session boundaries, including rest as an ordinary module. Returning to Manual or stopping a session cancels unfinished practice without refunding spent energy or awarding mastery.

Progress saves in this browser every five seconds and on page exit. Reopening resumes partial sessions and catches up at most **24 real hours** (60 simulated days); additional elapsed time is discarded. A closed browser does not execute code: catch-up computes missed sessions when reopened. Manual idle time never starts unsolicited activities. Web Locks allow one writing tab per origin; additional tabs show read-only progress and can be reloaded after the owning tab closes. Clearing site storage or Reset session clears development. Storage failure is shown in the UI.

## Extension architecture and roadmap coverage

`core.mjs` owns shared stats, session execution, persistence and scheduling, with no activity-specific IDs. `skills/shared.mjs` provides configurable implementations of `id`, `label`, `category`, `effortCost(state)`, `train(state, amount)` and `needScore(state, hours)`. Context includes that skill's own state, shared stats and support modifiers. Optional hooks supply session duration, effects, explanation and modifiers. To add a skill, export a `defineSkill` configuration from a new module and register it in `skills/index.mjs`; no core branch is needed. Presentation metadata selects reusable props/motions in `activity-view.js` and synthetic neural signal weights.

| Roadmap step | Implementation and verification |
| --- | --- |
| 1. Generic core / bench extraction | `core.mjs`, `skills/bench-press.mjs`, stable `engine.mjs` facade; trajectories compared frame-for-frame against the original engine fixture |
| 2. Shared adaptation | `adaptation.mjs`; monotonic, bounded positive-floor tests |
| 3. New gym modules | Chest flies and Stairmaster; common contract and execution tests |
| 4. Visible development | Aggregate mastery and gradual existing-mesh scaling; bounded mental/physical development tests |
| 5–6. Endurance and cognition | Marathon, swimming, blackjack and poker; identical session executor, distinct costs and signals |
| 7. VFB reference integration | Static names/IDs in `brain-view.js`, recorded query results under `data/`; see RESEARCH.md |
| 8. Autonomy | `life-ui.js` timer, explicit modes, nudges, need explanations and saves; multi-day scheduling, cancellation, clock and reload tests |
| 9. Supporting skills | Yoga, chess, cooking and ordinary rest module; cross-skill effect tests |
| 10. Long-horizon study | PhD module; mastery-horizon comparison tests |

Run `npm test` for the original mechanics/anatomy suite plus expansion regressions. `npm run build` bundles all skill modules and Three.js into the static output. Runtime code makes no external API calls. The Python scripts in `scripts/` are optional design-time VFB provenance tools, never required to build or run the game.
