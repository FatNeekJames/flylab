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
