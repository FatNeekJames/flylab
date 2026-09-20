# Fly brain research and implementation notes

Research checked 20 September 2026. Scope: adult Drosophila brain organization, sensory processing, descending pathways and leg motor control relevant to the requested panel. This is not an exhaustive review of fly biology.

## Evidence that informed the panel

| Primary source / anatomical resource | Relevant finding | Implementation |
| --- | --- | --- |
| [Dorkenwald et al., Nature (2024)](https://www.nature.com/articles/s41586-024-07558-y) | The adult female FlyWire brain reconstruction contains 139,255 neurons and 54.5 million synapses; it covers the central brain and both optic lobes. Its brain reconstruction does not include the full ventral nerve cord. | These are cited reference counts in the disclosure, never displayed as the number running in the app. |
| [Schlegel et al., Nature (2024)](https://www.nature.com/articles/s41586-024-07686-5) | Companion classification and annotation of FlyWire brain cells provides an anatomical vocabulary for interpreting the wiring. | Region names and cell/pathway distinctions are grounded in anatomical annotation, rather than invented “press neurons”. |
| [Virtual Fly Brain, anatomical templates](https://virtualflybrain.org/docs/data/templates/) | Adult brain templates distinguish optic neuropils, antennal lobes, mushroom body calyces and lobes, the central complex and subesophageal zone. | Bilateral optic lobes, paired mushroom/antennal regions, midline central-complex features and a ventral SEZ are represented schematically. |
| [Hulse et al., eLife (2021)](https://elifesciences.org/articles/66039) | Central-complex circuitry supports navigation and context-dependent action selection. | The central complex is described as an integration/navigation structure, not a human-like motor cortex. |
| [Namiki et al., eLife (2018)](https://elifesciences.org/articles/34272) | Descending neurons connect brain regions to nerve-cord circuits. Distinct pathways target leg and wing-associated neuropils. | Descending axons are represented as a pathway through the neck; leg control includes a separate VNC body inset. |
| [eLife, neural circuit mechanisms for steering control](https://elifesciences.org/articles/102230) | DNa01 and DNa02 project to the three leg neuromeres and connect to leg-control networks. These are studied in walking/steering, not bench pressing. | The VNC inset shows paired thoracic groups T1–T3. No named biological neuron is assigned a fictional bench-press function. |

## Anatomy and visual interpretation

- Optic lobes flank the central brain. Their simplified layers suggest lamina, medulla and lobula-complex organization; the silhouettes are not registered atlas surfaces.
- The mushroom-body schematic includes paired calyx-like clusters and vertical/medial branches. Mushroom bodies participate in learning and memory; the model does not simulate learning inside those units.
- Antennal lobes are paired olfactory regions. They receive no invented weight-dependent odor stimulus.
- The central complex is shown with bridge-like, fan-like and ring-like forms to suggest the protocerebral bridge, fan-shaped body and ellipsoid body. These are approximate visual motifs, not traced morphologies.
- The SEZ sits ventrally. Descending pathways leave the brain, while the VNC appears in a clearly labeled, displaced body inset. The dashed connector is a diagrammatic link, not an anatomical tract reconstruction.

## What actually runs

The panel runs a seeded, 384-unit leaky integrate-and-fire illustration in seven groups. It uses a 45 ms integration time constant, 25 ms refractory parameter and 15 ms time steps. These parameters and connection strengths are chosen for the game and are not fitted to experimental data. Group coupling loosely follows sensory-to-central-to-descending-to-VNC directionality; it is not extracted from FlyWire. Hand-built 3D point clouds are visual scaffolding, not one dot per biological neuron.

Each raster row represents one model unit. There are 200 chronological columns, each a 15 ms bin, giving a rolling 3-second window. “Spikes / 15 ms” is the sum of the latest column; “active units / 150 ms” counts distinct units with at least one event in the last ten bins. Colors identify the same region groups as the 3D view. Background stochastic input produces low ongoing activity at rest.

Game effort and movement phase raise synthetic motor-group input. Press/lower/hold bars are smoothed, normalized game-derived drive values. They are not measured firing rates, identified cell classes, or experimentally validated decoders. Neural activity follows the game; it does not control the lifting physics. Whole-brain emulation would require actual connectivity, validated dynamics, sensory interfaces and an embodied motor model, none of which is claimed here.

## Rack correction

The hook support height, bar radius, clearance and fixed limb segment lengths share constants in `bench.mjs`. The bar lifts clear of the lip, translates toward/away from the uprights, and settles onto the supports. Two-segment inverse kinematics preserves limb lengths across the full motion. After a failed lift, explicit rack assist recovers the bar from the safeties. The simulation retains pounds and the existing plate accounting.

## Verification

Automated tests cover supported resting height, hook-lip clearance during translation, continuity of the rerack path, fixed limb lengths throughout the reachable workspace, failed-lift support and assisted recovery, exact spike/raster counters, activity changes with effort, background activity, and neural reset. Existing lifting-mechanics tests remain in the suite.
