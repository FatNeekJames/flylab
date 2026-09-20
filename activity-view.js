import * as THREE from 'three';

// Presentation adapters are independent of the scheduler and skill state machine.
export class ActivityView {
  constructor(scene, fly, benchObjects) {
    this.fly = fly; this.benchObjects = benchObjects; this.rooms = new Map();
    this.materials = new Map(); this.roomRoot = new THREE.Group(); scene.add(this.roomRoot);
    this.roomRoot.visible = false; this.currentProp = null;
    this.dumbbells = [-1, 1].map(() => {
      const group = new THREE.Group(); fly.add(group); group.visible = false;
      this.box(group, 0xa0b7c5, [0, 0, 0], [.30, .045, .045]);
      for (const x of [-.15, .15]) this.box(group, 0x355480, [x, 0, 0], [.07, .20, .20]);
      return group;
    });
  }
  material(color) {
    if (!this.materials.has(color)) this.materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .6 }));
    return this.materials.get(color);
  }
  box(group, color, pos, size) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), this.material(color));
    mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
  }
  room(prop) {
    if (this.rooms.has(prop)) return this.rooms.get(prop);
    const g = new THREE.Group(); this.roomRoot.add(g); this.rooms.set(prop, g);
    const box = (color, pos, size) => this.box(g, color, pos, size);
    if (prop === 'stairs') {
      for (let i = 0; i < 5; i++) box(0x345671, [0, .06 + i * .09, 1.3 - i * .6], [1.7, .12 + i * .18, .58]);
      for (const side of [-1, 1]) box(0x849dae, [side * 1.05, .9, 0], [.06, .06, 3.5]);
    } else if (prop === 'pool') {
      box(0x267b91, [0, .12, .4], [4, .15, 4.6]);
      for (const side of [-1, 1]) box(0x99bcc9, [side * 2.1, .1, .4], [.2, .35, 4.8]);
      for (let z = -1.6; z <= 2.5; z += .28) box(0xe5d47c, [1.3, .25, z], [.08, .07, .14]);
    } else if (prop === 'track') {
      box(0x8b514c, [0, .02, .3], [3.5, .05, 5]);
      for (const x of [-1.2, 0, 1.2]) box(0xe3d9c8, [x, .05, .3], [.035, .012, 5]);
    } else if (prop === 'bed' || prop === 'mat') {
      box(prop === 'bed' ? 0x647fab : 0x809c69, [0, .28, .5], [1.6, .22, 3.3]);
      if (prop === 'bed') box(0xe1d7bb, [0, .48, -.57], [1.3, .2, .65]);
    } else {
      box(prop === 'dumbbells' ? 0x7798b0 : 0x536c63, [0, .7, .5], [1.2, .22, 3.4]);
      if (prop !== 'dumbbells') {
        box(0x3e565d, [0, 1.05, -1.5], [2.8, .15, 1.3]);
        if (prop === 'cards') {
          for (let i = 0; i < 5; i++) { const card = box(0xf4e9d2, [(i - 2) * .38, 1.15, -1.4], [.3, .015, .44]); card.rotation.y = (i - 2) * .09; box(i % 2 ? 0xa74c46 : 0x304455, [(i - 2) * .38, 1.17, -1.4], [.09, .015, .12]); }
        } else if (prop === 'chess') {
          for (let x = 0; x < 8; x++) for (let z = 0; z < 8; z++) box((x + z) % 2 ? 0x2a3943 : 0xd2c8a7, [(x - 3.5) * .18, 1.14, -1.5 + (z - 3.5) * .13], [.18, .02, .13]);
          for (let i = 0; i < 8; i++) box(i < 4 ? 0xdfd7b8 : 0x151f29, [(i % 4 - 1.5) * .35, 1.24, i < 4 ? -1.25 : -1.8], [.09, .18, .09]);
        } else if (prop === 'books') {
          for (let i = 0; i < 5; i++) box([0xb5a366, 0x547798, 0x986663][i % 3], [.7, 1.18 + i * .07, -1.6], [.5, .065, .7]);
          const page = box(0xece3c8, [-.4, 1.2, -1.35], [.85, .035, .65]); page.rotation.x = -.18;
        } else if (prop === 'kitchen') {
          box(0x202c38, [0, 1.16, -1.5], [1.1, .12, .85]);
          const pot = new THREE.Mesh(new THREE.CylinderGeometry(.32, .28, .3, 24), this.material(0x9eabb3)); pot.position.set(0, 1.37, -1.5); g.add(pot);
          box(0xcb915f, [.8, 1.19, -1.4], [.45, .08, .7]);
        }
      }
    }
    return g;
  }
  update(skill, clock) {
    const spec = skill?.presentation;
    this.dumbbells.forEach(d => { d.visible = spec?.prop === 'dumbbells'; });
    const bench = !spec || spec.prop === 'barbell';
    this.benchObjects.forEach(o => { o.visible = bench; });
    this.roomRoot.visible = !bench;
    this.fly.position.set(0, 0, 0); this.fly.rotation.set(0, 0, 0);
    if (bench) return null;
    const room = this.room(spec.prop);
    for (const g of this.rooms.values()) g.visible = g === room;
    const pulse = Math.sin(clock * 3), cycle = Math.sin(clock * 5);
    if (['run', 'step', 'swim', 'stretch', 'sleep'].includes(spec.motion)) this.fly.position.y = -.38;
    if (spec.motion === 'run' || spec.motion === 'step') { this.fly.position.y += Math.abs(cycle) * .055; this.fly.rotation.x = spec.motion === 'step' ? -.08 : .015 * cycle; }
    if (spec.motion === 'swim') { this.fly.position.y = -.55 + pulse * .025; this.fly.rotation.z = cycle * .05; }
    if (spec.motion === 'stretch') this.fly.rotation.z = pulse * .10;
    if (spec.motion === 'sleep') this.fly.position.y += Math.sin(clock) * .008;
    const target = side => {
      switch (spec.motion) {
        case 'fly': return [side * (.60 + .25 * (1 + pulse)), 1.45 + (1 - pulse) * .2, -.15];
        case 'run': case 'step': return [side * .68, .65 + .12 * Math.max(0, Math.sin(clock * 5 + side)), -.5 + .26 * Math.sin(clock * 5 + side)];
        case 'swim': return [side * (.64 + .12 * cycle), .90, -.3 + .4 * Math.sin(clock * 3 + side)];
        case 'stretch': return [side * (1 + .1 * pulse), 1.2, -.14];
        case 'sleep': return [side * .45, .9, -.45];
        case 'cook': return [side * .48 + pulse * .08, 1.4, -.9 + cycle * .08];
        default: return [side * .5, 1.24 + .05 * Math.sin(clock * 2 + side), -.9];
      }
    };
    this.dumbbells.forEach((d, i) => d.position.set(...target(i ? 1 : -1)));
    return target;
  }
}
