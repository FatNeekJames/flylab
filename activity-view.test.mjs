import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {trackPath,poolPath,stairPath,stairHeight,solveLimb,TAU} from './activity-motion.mjs';
import {ActivityView} from './activity-view.js';
import {skills} from './skills/index.mjs';
class HeadlessView extends ActivityView {label(g){const o=new THREE.Object3D();g.add(o);return o;}}
const setup=()=>{const scene=new THREE.Scene(),fly=new THREE.Group(),bench=new THREE.Object3D();scene.add(fly,bench);return {fly,bench,view:new HeadlessView(scene,fly,[bench])};};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

test('running and swimming traverse closed routes with continuous forward-facing turns',()=>{
 for(const [path,period] of [[trackPath,TAU/.30],[poolPath,2*(6+Math.PI*.55)/.8]]){
  assert.ok(distance(path(0),path(period))<1e-8);assert.ok(distance(path(0),path(period/2))>1);
  for(let t=0;t<period;t+=.019){const p=path(t),n=path(t+.0001),dx=n.x-p.x,dz=n.z-p.z;
   assert.ok(distance(p,n)<.001);assert.ok((-Math.sin(p.yaw)*dx-Math.cos(p.yaw)*dz)/Math.hypot(dx,dz)>.999);
  }
 }
});
test('stair walker gains elevation smoothly and returns by the other flight',()=>{
 let high=0,low=Infinity;const period=2*(6+Math.PI*.55)/.8/.72;
 for(let t=0;t<period;t+=.01){const p=stairPath(t);high=Math.max(high,p.y);low=Math.min(low,p.y);assert.ok(distance(p,stairPath(t+.001))<.004);}
 assert.ok(Math.abs(high-1.6)<1e-8);assert.equal(low,0);assert.ok(distance(stairPath(0),stairPath(period))<1e-8);
 assert.equal(stairHeight(3.1),0);assert.equal(stairHeight(-3),1.6);
});
test('activity IK preserves both segment lengths even for unreachable targets',()=>{
 for(const target of [[0,0,0],[8,4,3],[.2,.8,-.6],[0,-1,0]]){const s=solveLimb([0,0,0],target,.95,.66);
  assert.ok(Math.abs(Math.hypot(...s.joint)-.95)<1e-7);assert.ok(Math.abs(Math.hypot(...s.end.map((v,i)=>v-s.joint[i]))-.66)<1e-7);
 }
});
test('all activity poses fit the rig and give walking feet actual ground contact',()=>{
 for(const skill of skills.filter(s=>s.presentation.prop!=='barbell')){
  const {view,fly}=setup();
  for(let t=0;t<35;t+=.13){const pose=view.update(skill,t);
   for(const side of [-1,1]){
    const hand=pose.hand(side),root=[side*.23,1.12,-.05];assert.ok(Math.hypot(...hand.map((v,i)=>v-root[i]))<1.38,`${skill.id}: arm reach`);
    for(let i=0;i<2;i++){const target=pose.foot(side,i),hip=[side*.28,1.02,.25+i*.53],lengths=pose.legLengths??[.7,.67];
     assert.ok(Math.hypot(...target.map((v,j)=>v-hip[j]))<lengths[0]+lengths[1],`${skill.id}: foot reach at ${t}`);
     if(['track','stairs'].includes(skill.presentation.prop)){const point=fly.localToWorld(new THREE.Vector3(...target)),surface=skill.id==='stairmaster'?stairHeight(point.z):.08;assert.ok(point.y>=surface-1e-6);assert.ok(point.y<=surface+.271);}
    }
   }
  }
 }
});
test('staging switches restore bench transforms and hide activity props',()=>{
 const {view,fly,bench}=setup();view.update(skills.find(s=>s.id==='cooking'),0);assert.equal(bench.visible,false);assert.ok(Math.abs(fly.rotation.x)>1);
 assert.equal(view.update(skills[0],2),null);assert.equal(bench.visible,true);assert.equal(view.root.visible,false);assert.equal(view.accessories.visible,false);assert.equal(fly.position.length(),0);assert.equal(fly.rotation.x,0);assert.equal(fly.rotation.y,0);
});
test('walking feet remain planted during stance and alternate during swing',()=>{
 const {view,fly}=setup(),skill=skills.find(s=>s.id==='marathon');view.update(skill,0);
 const a=view.update(skill,.1),first=fly.localToWorld(new THREE.Vector3(...a.foot(-1,0)));
 const b=view.update(skill,.2),second=fly.localToWorld(new THREE.Vector3(...b.foot(-1,0)));
 assert.ok(first.distanceTo(second)<1e-7);
 const c=view.update(skill,.52),swing=fly.localToWorld(new THREE.Vector3(...c.foot(-1,0)));assert.ok(swing.y>.09);
});
