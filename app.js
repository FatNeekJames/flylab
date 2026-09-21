import {createFlyAppearance,detailFlyLeg} from './fly-appearance.mjs';
import {ResearchController} from './research-ui.js';
import * as THREE from 'three';
import {FlyEngine} from './engine.mjs';
import {BENCH,BenchMotion,elbowFor} from './bench.mjs';
import {BrainPanel} from './brain-view.js';
import {ActivityCore} from './core.mjs';
import {skills} from './skills/index.mjs';
import {LifeController} from './life-ui.js';
import {ActivityView} from './activity-view.js';
import {BlackjackController} from './blackjack-ui.js';
import {solveLimb} from './activity-motion.mjs';
const $=id=>document.getElementById(id), core=new ActivityCore(skills),engine=new FlyEngine(core),motion=new BenchMotion();
try{engine.best=Number(localStorage.getItem('flylab-best'))||0}catch{}
const host=$('scene'),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,100);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.setClearColor(0x000000,0);host.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xb5d8ff,0x34341b,2.3));const key=new THREE.DirectionalLight(0xffedbc,4);key.position.set(-3,8,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7});key.shadow.bias=-.001;scene.add(key);const rim=new THREE.DirectionalLight(0x6aafff,3);rim.position.set(5,4,-5);scene.add(rim);
const mat=(color,metalness=0,roughness=.5)=>new THREE.MeshStandardMaterial({color,metalness,roughness});const blue=mat(0x3e628d,.55),steel=mat(0xa0b7c5,.8,.25),pad=mat(0x7798b0,0,.85),gold=mat(0xe5bd42,.15),darkgold=mat(0xb99727,.15),eye=mat(0x933e22,.35,.25),black=mat(0x172a35,.4),plateM=mat(0x355480,.55,.35);
function mesh(geo,m,x,y,z,parent=scene){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function box(x,y,z,w,h,d,m,parent=scene){return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent)}
function orb(x,y,z,rx,ry,rz,m,parent=scene){const o=mesh(new THREE.SphereGeometry(1,26,18),m,x,y,z,parent);o.scale.set(rx,ry,rz);return o}
function rod(a,b,r,m,parent=scene){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),o=mesh(new THREE.CylinderGeometry(r,r,start.distanceTo(end),10),m,0,0,0,parent);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(new THREE.Vector3(...a)).normalize());return o}
const floor=box(0,-.13,0,9,.2,7,mat(0x182733,.2,.9));const grid=new THREE.GridHelper(32,64,0x344b5b,0x233744);grid.position.y=-.022;scene.add(grid);
const benchStart=scene.children.length;
// Bench runs lengthwise along Z; the barbell lies across X.
box(0,.7,.5,1.05,.25,3.6,pad);box(0,.54,.5,.83,.12,3.5,blue);
for(const z of [-.8,1.7]){box(0,.22,z,.18,.6,.2,blue);box(0,.04,z,1.75,.15,.35,blue)}
for(const x of [-1.52,1.52]){box(x,1.04,-.95,.15,2.08,.17,blue);box(x,.04,-.6,.65,.17,2.6,blue);box(x,BENCH.hookTop-.06,-.76,.17,.12,.48,steel);box(x,BENCH.lipTop-.065,-.53,.15,.13,.12,blue);box(x,BENCH.safetyTop-.06,.15,.12,.12,2.15,blue)}box(0,.25,-1.6,3.1,.12,.14,blue);
const benchObjects=scene.children.slice(benchStart);
const fly=new THREE.Group();scene.add(fly);
const {abdomen,thorax,legMaterial,hairMaterial}=createFlyAppearance(fly);
const legs=new THREE.Group();fly.add(legs);
const armRig=[],footRig=[];
for(const s of [-1,1]){
 const upper=rod([s*.23,1.12,-.05],[s*.62,1.5,-.12],.028,legMaterial,legs);
 const lower=rod([s*.62,1.5,-.12],[s*.79,2,-.38],.024,legMaterial,legs);
 const hand=orb(s*.79,2,-.38,.047,.045,.06,legMaterial,legs);
 armRig.push({s,upper,lower,hand,upperLength:upper.geometry.parameters.height,lowerLength:lower.geometry.parameters.height});
 for(let i=0;i<2;i++){const zz=.25+i*.53,root=[s*.28,1.02,zz],joint=[s*(.66+i*.12),.83,zz+.27],end=[s*(.84+i*.18),.37,zz+.52];const upper=rod(root,joint,.022,legMaterial,legs),lower=rod(joint,end,.016,legMaterial,legs);footRig.push({s,i,root,joint,end,upper,lower,upperLength:upper.geometry.parameters.height,lowerLength:lower.geometry.parameters.height})}
}
const axis=new THREE.Vector3(0,1,0),ra=new THREE.Vector3(),rb=new THREE.Vector3(),rd=new THREE.Vector3();
function moveRod(o,a,b,originalLength){ra.set(...a);rb.set(...b);rd.subVectors(rb,ra);o.position.copy(ra).add(rb).multiplyScalar(.5);o.scale.y=rd.length()/originalLength;o.quaternion.setFromUnitVectors(axis,rd.normalize())}
for(const rig of [...armRig,...footRig])for(const segment of [rig.upper,rig.lower])detailFlyLeg(segment,hairMaterial);

const rackAssist=new THREE.Group();scene.add(rackAssist);for(const x of [-1.3,1.3])box(x,0,0,.24,.08,.3,mat(0x6bddc1,.5),rackAssist);rackAssist.visible=false;
const bar=new THREE.Group();scene.add(bar);rod([-2.55,0,0],[2.55,0,0],.045,steel,bar);for(const s of [-1,1])rod([s*1.66,0,0],[s*2.45,0,0],.067,black,bar);
let plateGroup=new THREE.Group();bar.add(plateGroup);
function labelTexture(value){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#e4ebce';x.textAlign='center';x.font='bold 32px monospace';x.fillText(value,64,43);x.font='13px monospace';x.fillText('LB',64,96);x.strokeStyle='#95a6b5';x.lineWidth=3;x.beginPath();x.arc(64,64,59,0,Math.PI*2);x.stroke();return new THREE.CanvasTexture(c)}
const labels=new Map([45,25,10,5,2.5].map(v=>[v,new THREE.MeshBasicMaterial({map:labelTexture(v),transparent:true,side:THREE.DoubleSide})]));
function rebuildPlates(){for(const o of [...plateGroup.children]){o.geometry.dispose();plateGroup.remove(o)}let rem=(engine.weight-20)/2;const list=[];for(const p of [45,25,10,5,2.5])while(rem>=p-.01){list.push(p);rem-=p}for(const side of [-1,1])list.forEach((p,i)=>{const r=.28+Math.sqrt(p/45)*.4,xx=side*(1.70+i*.125);const o=mesh(new THREE.CylinderGeometry(r,r,.11,48),plateM,xx,0,0,plateGroup);o.rotation.z=Math.PI/2;const border=mesh(new THREE.TorusGeometry(r-.025,.012,6,48),steel,xx+side*.06,0,0,plateGroup);border.rotation.y=Math.PI/2;const face=mesh(new THREE.PlaneGeometry(r*1.8,r*1.8),labels.get(p),xx+side*.068,0,0,plateGroup);face.rotation.y=side*Math.PI/2});}
let yaw=.62,pitch=.43,distance=9.8,drag=null,sceneDistance=9.8,sceneHeight=1;
function view(){const d=distance*sceneDistance/9.8;camera.position.set(Math.sin(yaw)*Math.cos(pitch)*d,sceneHeight+Math.sin(pitch)*d,Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(0,sceneHeight,0)}view();
new ResizeObserver(()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)}).observe(host);
host.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];host.setPointerCapture(e.pointerId)});host.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.008;pitch=Math.max(.1,Math.min(1.25,pitch+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY];view()});host.addEventListener('pointerup',()=>drag=null);host.addEventListener('pointercancel',()=>drag=null);host.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(6,Math.min(15,distance+e.deltaY*.008));view()},{passive:false});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('selected',x===b));yaw=b.dataset.view==='side'?Math.PI/2:b.dataset.view==='front'?0:.62;pitch=b.dataset.view==='perspective'?.43:.22;view()});
let sound=false,audio;
function beep(f=180){if(!sound)return;audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(f/2,audio.currentTime+.15);g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.2);o.start();o.stop(audio.currentTime+.2)}
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',sound);beep(400)};
function load(w){engine.load(w);$('weight').value=engine.weight;$('load').value=engine.weight;$('stageWeight').textContent=engine.weight;rebuildPlates();beep()}
$('less').onclick=()=>load(engine.weight-5);$('more').onclick=()=>load(engine.weight+5);$('weight').onchange=e=>load(Number(e.target.value));$('load').oninput=e=>load(Number(e.target.value));document.querySelectorAll('[data-plate]').forEach(b=>b.onclick=()=>load(engine.weight+Number(b.dataset.plate)*2));document.querySelectorAll('[data-weight]').forEach(b=>b.onclick=()=>load(Number(b.dataset.weight)));
$('lift').onclick=()=>{if(engine.running)motion.rack(engine);else motion.start(engine)};$('max').onclick=()=>motion.start(engine,true);$('rest').onclick=()=>{motion.rack(engine,true);push(false)};
const push=v=>{v=v&&!life?.active&&life?.owner;engine.pushing=v;$('push').classList.toggle('active',v)};$('push').onpointerdown=e=>{e.preventDefault();$('push').setPointerCapture(e.pointerId);push(true)};$('push').onpointerup=()=>push(false);$('push').onpointercancel=()=>push(false);window.addEventListener('keydown',e=>{if(e.code==='Space'&&document.activeElement.tagName!=='INPUT'){e.preventDefault();push(true)}});window.addEventListener('keyup',e=>{if(e.code==='Space')push(false)});window.addEventListener('blur',()=>push(false));document.addEventListener('visibilitychange',()=>{if(document.hidden)push(false)});
$('reset').onclick=()=>{engine.reset();life.reset();motion.reset();brainPanel.reset();try{localStorage.removeItem('flylab-best')}catch{}push(false);load(140);$('log').textContent='Fresh session. Small fly. Big possibilities.'};load(140);
benchObjects.push(bar,rackAssist);
const life=new LifeController(core,engine,motion),activityView=new ActivityView(scene,fly,benchObjects),blackjack=new BlackjackController(core);
const research=new ResearchController(core,life);
const brainPanel=new BrainPanel(engine),trace=$('trace').getContext('2d');const history=new Array(160).fill(0);let last=0,clock=0,sample=0,version=-1,prevRep=0;
function drawTrace(t){trace.clearRect(0,0,600,110);trace.strokeStyle='#293640';trace.lineWidth=1;for(let y=10;y<110;y+=25){trace.beginPath();trace.moveTo(0,y);trace.lineTo(600,y);trace.stroke()}trace.strokeStyle='#b7e184';trace.lineWidth=1.6;trace.beginPath();history.forEach((v,i)=>{const y=95-v*.76;i?trace.lineTo(i*600/159,y):trace.moveTo(0,y)});trace.stroke()}
function frame(now){const dt=Math.min((now-last)/1000||0,.05);last=now;clock+=dt;if(!life.active&&life.owner)motion.step(engine,dt);
 const blackjackState=blackjack.sync(),activity=life.skill,pose=activityView.update(activity,clock,blackjackState),growth=core.development.growth;sceneDistance=activityView.cameraDistance;sceneHeight=activityView.cameraHeight;view();floor.scale.set(pose?1.5:1,1,pose?1.5:1);host.setAttribute('aria-label',pose?`${activity.label}: ${activityView.status}. Drag to orbit; scroll to zoom.`:'Interactive 3D fly bench press. Drag to orbit; scroll to zoom.');thorax.scale.set(.33*(1+.16*growth),.28*(1+.08*growth),.38);abdomen.scale.x=.44*(1+.06*growth);
 const autoBench=life.active&&activity?.presentation.prop==='barbell';const barY=autoBench?BENCH.bottom+(1+Math.cos(clock*2))*.5*(BENCH.lockout-BENCH.bottom):motion.y,barZ=autoBench?BENCH.liftZ:motion.z;
 bar.position.set(engine.running&&engine.stall>0?Math.sin(clock*45)*.01:0,barY,barZ);rackAssist.visible=!pose&&motion.assisted;rackAssist.position.y=motion.y-BENCH.barRadius-.04;rackAssist.position.z=motion.z;
 for(const r of armRig){const shoulder=[r.s*.23,1.12,-.05],target=pose?pose.hand(r.s):[r.s*.79+bar.position.x,barY,barZ],solved=pose?solveLimb(shoulder,target,BENCH.upperLeg,BENCH.lowerLeg,r.s):{end:target,joint:elbowFor(shoulder,target,r.s)};moveRod(r.upper,shoulder,solved.joint,r.upperLength);moveRod(r.lower,solved.joint,solved.end,r.lowerLength);r.hand.position.set(...solved.end);r.upper.scale.x=r.upper.scale.z=r.lower.scale.x=r.lower.scale.z=1+.12*growth}
 for(const r of footRig){const solved=pose?solveLimb(r.root,pose.foot(r.s,r.i),pose.legLengths?.[0]??r.upperLength,pose.legLengths?.[1]??r.lowerLength,r.s):{end:r.end,joint:r.joint};moveRod(r.upper,r.root,solved.joint,r.upperLength);moveRod(r.lower,solved.joint,solved.end,r.lowerLength);}
 document.querySelector('.loadpanel').hidden=!!pose;document.querySelector('.conditionfoot').hidden=!!pose;
 $('reps').textContent=String(engine.reps).padStart(2,'0');$('best').textContent=engine.best||'—';$('energyText').textContent=Math.round(engine.energy)+'%';$('energyBar').style.width=engine.energy+'%';$('effortText').textContent=Math.round(engine.effort)+'%';$('effortBar').style.width=engine.effort+'%';$('capacity').textContent=Math.round(engine.capacity);$('lift').innerHTML=engine.running?'■ &nbsp; Rack the bar':'▶ &nbsp; Start lifting';$('state').textContent=motion.assisted?'RACK ASSIST':motion.mode==='unracking'?'UNRACKING':motion.mode==='racking'?'RERACKING':engine.running?(engine.stall?'STRUGGLING':engine.single?'MAX ATTEMPT':'LIFTING'):engine.resting?'RECOVERING':'READY TO LIFT';$('mood').textContent=engine.energy<30?'RUNNING ON FUMES':engine.pushing?'ALL SIX LEGS IN':engine.running?'PUTTING IN WORK':'FEELING FRESH';$('callout').textContent=engine.running?(engine.stall?'A little help here?!':engine.pushing?'Light weight. LIGHT WEIGHT!':engine.effort>85?'Every millimetre counts.':'Just another day at the lab.'):engine.resting?(engine.energy<90?'Tiny breather. Big comeback.':'Recovered. Ready for round two.'):'He’s got this. Probably.';
 if(life.active){$('state').textContent=activityView.status||(activity?activity.category.toUpperCase():'AUTONOMOUS');$('callout').textContent=activity?activity.label:'Choosing the next adventure.';$('mood').textContent=core.mode==='auto'?'SELF-DIRECTED':'TRAINING';$('log').textContent=core.current?.reason??'Choosing the next session';$('effortText').textContent=Math.round((life.neuralSignal()?.motor??0)*100)+'%';$('effortBar').style.width=((life.neuralSignal()?.motor??0)*100)+'%'}
 if(pose){$('stageWeight').textContent=Math.round((core.current?.elapsed??0)/(core.current?.duration??1)*100);$('reps').textContent=core.states[activity.id].mastery.toFixed(1);$('best').textContent=core.states[activity.id].sessions.toFixed(1);}else{$('stageWeight').textContent=engine.weight;}
 $('stageLoadLabel').textContent=pose?'SESSION':'ON THE BAR';$('stageRepLabel').textContent=pose?'MASTERY %':'COMPLETED REPS';$('stageBestLabel').textContent=pose?'SESSIONS':'PERSONAL BEST';$('stageLoadUnit').textContent=pose?'%':'LB';$('stageBestUnit').textContent=pose?'':'LB';
 if(version!==engine.version){version=engine.version;$('log').textContent=engine.event}if(engine.reps>prevRep){beep(540);try{localStorage.setItem('flylab-best',engine.best)}catch{}}prevRep=engine.reps;
 sample+=dt;if(sample>.06){sample=0;history.push(engine.effort*(.7+.25*Math.sin(clock*22))+(engine.running?Math.sin(clock*73)*9:Math.sin(clock*5)*2));history.shift();drawTrace(clock)}engine.activitySignal=life.neuralSignal();if(blackjackState&&engine.activitySignal)engine.activitySignal.decision=blackjackState.phase==='thinking'?1:.08;brainPanel.update(dt);renderer.render(scene,camera);requestAnimationFrame(frame)}requestAnimationFrame(frame);
