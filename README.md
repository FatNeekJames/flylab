# FlyLab

[Play FlyLab](https://fatneekjames.github.io/flylab/) · [GitHub repository](https://github.com/FatNeekJames/flylab)

An interactive 3D recreation inspired by the supplied fly bench-press video. Built with Three.js and vanilla JavaScript. The simulation assets are procedural. Live AI research uses a private local service and an OpenAI API key; the base game, VFB anatomy and Minecraft bot do not require that key.

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

The twelve modules cover bench press, chest flies, Stairmaster, marathon training, swimming, blackjack, poker, PhD studies, yoga/stretching, chess, cooking and rest/sleep. Blackjack runs complete automatic card-game rounds; PhD studies now produce research notes through the local service; poker and chess still remain animated practice sessions. There is no real money or betting.

Repeated practice reduces session energy cost toward a nonzero 25% floor. Yoga mastery reduces fatigue from other physical activities by up to 30%; cooking mastery accelerates rest recovery by up to 60%. PhD mastery grows much more slowly than chess or poker. Small changes to the existing thorax, abdomen and limb thickness reflect cumulative mastery across every practiced skill, including mental activities. These are game mechanics, not biological measurements.

A timer independent of rendering advances sessions at **real time by default**, with 10× and 60× fast-forward controls. Energy and fatigue change throughout sessions; mastery is awarded on completion. Autonomous scheduling chooses the highest eligible need at session boundaries, including rest as an ordinary module. Returning to Manual or stopping a session cancels unfinished practice without refunding spent energy or awarding mastery.

Progress saves in this browser every five seconds and on page exit. Reopening resumes partial sessions and catches up at most **24 real hours** (at the selected clock speed); additional elapsed time is discarded. A closed browser does not execute code: catch-up computes missed sessions when reopened. Manual idle time never starts unsolicited activities. Web Locks allow one writing tab per origin; additional tabs show read-only progress and can be reloaded after the owning tab closes. Clearing site storage or Reset session clears development. Storage failure is shown in the UI.

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

Run `npm test` for the original mechanics/anatomy suite plus expansion regressions. `npm run build` bundles all skill modules and Three.js into the static output. VFB research calls its public API; AI study calls the local service, which uses the OpenAI Responses API. The Python scripts in `scripts/` are optional design-time VFB provenance tools, never required to build or run the game.

## Activity staging and movement

Activities now have distinct environments and full-body poses. Bench press retains the original reclining rig; chest flies use an upright cable station with moving handles and connected cables. Stairmaster is a revolving stair mill: treads descend into the housing and recycle while the fly stays on the machine, stepping onto the moving treads and holding its rails. Marathon training follows a lane on a complete oval track, with planted stance feet and alternating swing phases. Swimming travels down the pool and makes continuous turns into the return lane, with alternating strokes, kicks and a wake.

Cooking stands at a counter and stirs a pot while chopping. PhD study uses a monitor, keyboard and books inspired by the supplied desk reference. Card and chess activities use dedicated felt/board tables with reaching hands; yoga uses a standing balance pose on a mat; sleep uses a bed. The upright character is an anthropomorphic game pose, not a claim about natural fly locomotion. The four supporting legs are articulated for these activities, while the existing bench posture and limb constants are restored when returning to bench press.

Scene framing adapts to the track, pool and stairs while retaining orbit/zoom controls. Non-bench scenes show session progress, mastery and practice counts, and hide barbell-only controls. `activity-motion.mjs` contains deterministic routes and a fixed-length limb solver; `activity-view.test.mjs` checks route continuity, direction, moving-tread contact, limb reach, planted feet and bench restoration. All geometry remains procedural; the supplied reference videos are not shipped.

## Blackjack and the revolving stair mill

The stair mill replaces the previous outdoor circuit. It has a console, handrails, moving stair treads and a fixed workout position. Its 51 steps/minute display describes the presentation cadence; the legs follow the same tread motion during stance.

Blackjack now has a six-deck shuffled shoe, a visible dealer who deals cards, a face-down hole card, and complete hands. The fly pauses to consider its hand and the dealer's upcard before choosing hit, stand, double or split. The panel shows cards, totals, legal actions, the chosen action, reasoning, history and results. The dealer reveals its hole card after player play and draws below 17, standing on soft 17. Splits create independently settled hands (up to four); doubling adds one card and ends that hand. Split aces receive one card each, and split 21 is not a natural. Naturals pay 3:2. There is no insurance or surrender. These are practice points with no purchases, wagering service or cash value.

Rules were checked against [Bicycle's blackjack rules](https://bicyclecards.com/how-to-play/blackjack). The fly's rule-based choices follow the [multi-deck, stand-on-soft-17 strategy](https://wizardofodds.com/games/blackjack/strategy/8-decks/), with double-after-split and legal-action fallbacks. This is a static strategy, not a neural model learning blackjack. The decision function receives only the current player hand, the dealer upcard and hand count; it cannot inspect the hole card or remaining shoe. The brain panel's decision signal rises during the thinking phase as a game visualization.

A blackjack skill session lasts one simulated hour (one real hour at the default clock speed), automatically playing successive rounds. A per-device seed and session start reconstruct the same current game after reload; the live lifecycle timer still owns session timing. Leaving the activity stops its table. `blackjack.mjs` contains pure rules and strategy, `blackjack-ui.js` presents public game state, and `blackjack-view.js` renders the dealer and cards. Blackjack itself makes no external requests.


## Research journal and Minecraft lab

Run `npm start` and open [the local app](http://localhost:5173/#researchPanel). The dedicated `OPENAI_API_KEY` belongs in the ignored `.env.local` file; never put it in the browser or commit it. Node 24 is recommended. The server binds only to loopback, denies cross-origin API access and serves only an explicit public-asset list. GitHub Pages serves the base simulation and anatomy fallback, with a link to the local app for research and Minecraft. Local and published browser progress are separate.

Choose any educational topic (or leave blank for a rotating curriculum) and start a research hour. PhD sessions trigger four checkpoints at 0, 15, 30 and 45 study minutes. Each uses web search and then a structured note-generation call, with original source links, uncertainty and follow-up questions. Default model: `gpt-5-mini`; override with `FLYLAB_MODEL`. The service allows 12 checkpoint attempts per UTC day and only one in-flight checkpoint. Fast-forward never bypasses that budget. OpenAI billing failures pause research with an actionable error; no notes or recall improvements are fabricated. Resume explicitly after fixing the failure.

Research and learned weights persist privately in `.flylab/research.json`. The journal lists sessions, notes, source links, before/after recall questions and mistakes, and exports JSON. “Ask the fly’s learned notes” uses the local learner without a further API call. An online softmax classifier trains on hashed word features from stored notes and training questions, with replay of older notes (up to 200). Held-out paraphrased questions are never used for training. This measures note retrieval, not understanding, factual correctness or a general intelligence score; the OpenAI model is not fine-tuned. Research does not yet train the poker/chess policies. The fly's original mastery numbers remain separate game statistics.

An open owning browser tab advances study time. Closing it pauses new checkpoints once due work is finished; reopening can catch up the current/saved session within the daily budget. A stopped or failed checkpoint does not earn learned notes. Resetting the game does not erase the research journal.

For Minecraft, open a **Java practice world to LAN**, enter its port in the Minecraft lab and connect. The bot joins as `FlyLab` using the Minecraft protocol; it does not control the launcher or your desktop. A first curriculum gathers one log, crafts planks and crafts a table. Attempts are bounded to 40 seconds, observe inventory changes before recording success, and save target outcomes to `.flylab/minecraft.json`. An upper-confidence-bound target selector balances untried wood types against past success rates. Automatic practice stops after a crafting table is obtained; pathfinding cannot dig incidental blocks or build towers. The selected log is intentionally mined. This is a small, testable starter curriculum, not an implementation of a general Minecraft agent. Authenticated servers require separate bot-account setup; the connector does not bypass authentication.

VFB reads now use a same-origin proxy locally and a verified, retrieval-dated fallback for all seven displayed regions if a live request fails. The fallback is clearly marked; arbitrary VFB searches still require network access.


## Progressive workout plans

Scheduled bench and cable-fly sessions rotate hypertrophy (4×10), strength (5×5), and volume (3×12), with a warm-up, individual reps, racking and timed rests. Three completed hard sessions increase the underlying working load; the actual barbell plates follow the selected plan. Returning to manual lifting restores the user's chosen weight and original mechanics. Manual individual reps do not count as completed programmed workouts.

Marathon, swimming and Stairmaster sessions increase targets by 5% after a completed hard session, with bounded pace and volume. Distance/step totals, animation routes and the live workout display use the same session progress. High fatigue, low energy or every sixth completed workout triggers a lighter recovery session; it does not raise the next hard target. Cancelled sessions do not advance progression. Plans and progression persist across reloads and completed plans appear in history. These are game progression rules, not a biological hypertrophy model or human exercise advice.
