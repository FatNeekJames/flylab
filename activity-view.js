import * as THREE from 'three';
import {buildBlackjackRoom,updateBlackjackRoom} from './blackjack-view.js';
import {trackPath,poolPath,machineTread,machineFoot,STAIR_MACHINE,TAU} from './activity-motion.mjs';

// Presentation-only staging: session rules remain in the shared activity core.
export class ActivityView {
 constructor(scene,fly,benchObjects){
  this.fly=fly;this.benchObjects=benchObjects;this.rooms=new Map();this.materials=new Map();this.root=new THREE.Group();scene.add(this.root);this.current=null;this.started=0;
  this.cameraDistance=9.8;this.cameraHeight=1;this.status='';this.accessories=new THREE.Group();fly.add(this.accessories);this.pivot=new THREE.Vector3(0,1.08,.13);
  this.handles=[-1,1].map(()=>{const g=new THREE.Group();this.accessories.add(g);this.box(g,0xcedce0,[0,0,0],[.23,.055,.055]);return g;});
 }
 material(color){if(!this.materials.has(color))this.materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.65}));return this.materials.get(color);}
 box(g,color,pos,size){const o=new THREE.Mesh(new THREE.BoxGeometry(...size),this.material(color));o.position.set(...pos);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 cylinder(g,color,pos,r,h){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),this.material(color));o.position.set(...pos);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 line(g,points,color=0xc3d5d1,width=.025){const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),o=new THREE.Mesh(new THREE.TubeGeometry(c,96,width,6,false),this.material(color));g.add(o);return o;}
 label(g,text,pos,size=1.8,color='#d8e7d6'){
  const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='bold 44px monospace';ctx.textAlign='center';ctx.fillText(text,256,76);
  const o=new THREE.Mesh(new THREE.PlaneGeometry(size,size/4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,side:THREE.DoubleSide}));o.position.set(...pos);g.add(o);return o;
 }
 table(g,color=0x5e7765){this.box(g,color,[0,1.22,-1.05],[2.8,.15,1.35]);for(const x of [-1.15,1.15])for(const z of [-1.5,-.6])this.box(g,0x374c58,[x,.59,z],[.10,1.18,.10]);}
 room(prop){
  if(this.rooms.has(prop))return this.rooms.get(prop);
  const g=new THREE.Group();this.root.add(g);this.rooms.set(prop,g);const box=(c,p,s)=>this.box(g,c,p,s);
  if(prop==='track'){
   const shape=new THREE.Shape();shape.absellipse(0,0,5.5,3.95,0,TAU,false);const hole=new THREE.Path();hole.absellipse(0,0,3.2,1.65,0,TAU,true);shape.holes.push(hole);
   const ring=new THREE.Mesh(new THREE.ShapeGeometry(shape,100),this.material(0x985548));ring.rotation.x=-Math.PI/2;ring.position.y=.03;ring.receiveShadow=true;g.add(ring);
   const grass=this.cylinder(g,0x42664d,[0,.005,0],1,.04);grass.scale.set(3.18,1,1.63);
   for(let k=0;k<4;k++){const pts=[];for(let i=0;i<=128;i++){const a=i/128*TAU;pts.push([(3.35+k*.67)*Math.cos(a),.06,(1.8+k*.67)*Math.sin(a)]);}this.line(g,pts,0xe8d7b5,.018);}
   box(0xf1e5cf,[0,.07,2.8],[.09,.02,2.3]);for(let k=0;k<3;k++){const n=this.label(g,String(k+1),[.28,.09,2.1+k*.65],.36);n.rotation.x=-Math.PI/2;}
   for(const z of [-.6,.6]){box(0x789191,[0,.22,z],[2,.16,.45]);for(const x of [-.8,.8])box(0x354b52,[x,.1,z],[.09,.2,.09]);}this.label(g,'FLY ATHLETICS',[0,.8,-4.2],3);
  }else if(prop==='pool'){
   box(0xc0d4d5,[0,-.08,0],[4.5,.15,11.2]);box(0x184b68,[0,.03,0],[3.6,.10,10.4]);
   const water=box(0x319fb4,[0,.32,0],[3.6,.025,10.4]);water.material=new THREE.MeshPhysicalMaterial({color:0x259eb5,transparent:true,opacity:.66,roughness:.15,metalness:.18});
   for(const x of [-1.95,1.95])box(0xe2ddc9,[x,.20,0],[.3,.4,10.8]);for(const z of [-5.3,5.3])box(0xe2ddc9,[0,.2,z],[4.2,.4,.25]);
   for(const x of [-1.2,0,1.2])for(let z=-5;z<5.1;z+=.24)this.cylinder(g,Math.round(z*10)%3?0xe9d995:0xd5594e,[x,.36,z],.055,.075);
   for(const x of [-.6,.6])box(0x193e51,[x,.09,0],[.045,.025,10.0]);for(const z of [-5.55,5.55]){box(0x315975,[0,.48,z],[.8,.15,.5]);this.label(g,'25 m',[0,.85,z],.8);}
   const wakes=new THREE.Group();g.add(wakes);g.userData.wakes=wakes;for(let i=0;i<5;i++){const o=new THREE.Mesh(new THREE.TorusGeometry(.3+i*.12,.012,5,32),this.material(0xa8e6e7));o.rotation.x=-Math.PI/2;wakes.add(o);}
  }else if(prop==='stairs'){
   box(0x263d4b,[0,.08,0],[2.8,.16,3.8]);
   const profile=new THREE.Shape();profile.moveTo(-1.8,0);profile.lineTo(1.5,0);profile.lineTo(1.5,1.85);profile.lineTo(-1.8,.25);profile.closePath();
   for(const x of [-1.2,1.02]){const housing=new THREE.Mesh(new THREE.ExtrudeGeometry(profile,{depth:.18,bevelEnabled:false}),this.material(0x35546b));housing.rotation.y=Math.PI/2;housing.position.x=x;g.add(housing);}
   g.userData.treads=[];for(let i=0;i<8;i++){const tread=new THREE.Group();g.add(tread);this.box(tread,0x758994,[0,-.06,0],[2.05,.12,.48]);this.box(tread,0xdac675,[0,.008,.20],[2.02,.018,.04]);for(let j=0;j<6;j++)this.box(tread,0x405563,[0,.009,-.18+j*.065],[1.9,.012,.012]);g.userData.treads.push(tread);}
   for(const x of [-1.04,1.04]){this.line(g,[[x,.3,1.6],[x,2.3,.7],[x,2.9,-1.15],[x,1.7,-1.35]],0xb0c2c6,.05);}
   box(0x254051,[0,2.95,-1.30],[1.45,.65,.18]);box(0x91c1b5,[0,2.97,-1.19],[1.23,.44,.035]);this.label(g,'STAIR MILL',[0,3.40,-1.3],1.5);
   const display=this.label(g,'51 STEPS / MIN',[0,2.98,-1.16],1.05);g.userData.display=display;
  }else if(prop==='dumbbells'){
   box(0x354e59,[0,.015,0],[4.7,.04,3.4]);for(const s of [-1,1]){box(0x547797,[s*1.9,1.25,.15],[.3,2.5,.45]);box(0x263d4f,[s*1.9,.25,.15],[.6,.5,.7]);for(let j=0;j<5;j++)box(0x8fa5af,[s*1.9,.18+j*.12,-.13],[.42,.045,.26]);this.cylinder(g,0xc3d5d8,[s*1.9,1.95,-.15],.12,.1);}
   g.userData.cables=[-1,1].map(()=>{const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),l=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xced5ca}));g.add(l);return l;});this.label(g,'STANDING CABLE FLY',[0,2.6,.3],2.8);
  }else if(prop==='kitchen'){
   this.table(g,0xd7c7a6);box(0x486771,[0,.55,-1.1],[2.55,1.1,1.05]);for(const x of [-.65,.65]){box(0x64808b,[x,.64,-.55],[1.15,.82,.05]);box(0xe0c383,[x,.85,-.50],[.3,.045,.055]);}
   box(0x172d39,[-.55,1.32,-1.05],[1.05,.06,1]);this.cylinder(g,0xabbfc5,[-.55,1.51,-1.05],.32,.32);this.cylinder(g,0xc57b46,[-.55,1.68,-1.05],.27,.015);for(const x of [-.95,-.15])box(0x314653,[x,1.55,-1.05],[.22,.06,.1]);
   box(0xbe8b51,[.63,1.33,-.95],[.85,.06,.6]);for(let i=0;i<5;i++)box(i%2?0xda7744:0x7b9d5e,[.43+i*.09,1.40,-.95],[.07,.09,.17]);g.userData.spoon=this.line(g,[[0,0,0],[0,-.3,0]],0xd7ba78,.025);g.userData.knife=box(0xc4d6d9,[0,0,0],[.025,.11,.35]);this.label(g,'TINY TEST KITCHEN',[0,2.65,-1.8],2.5);
  }else if(prop==='books'){
   this.table(g,0x9baeb8);box(0x2a3b49,[.15,1.9,-1.35],[1.5,1,.09]);box(0x9fc8c9,[.15,1.9,-1.29],[1.35,.84,.025]);box(0x4d6270,[.15,1.45,-1.35],[.09,.4,.1]);box(0xb9ccd1,[.15,1.34,-.82],[1,.06,.36]);
   for(let row=0;row<3;row++)for(let col=0;col<10;col++)box(0x557080,[-.27+col*.09,1.377,-.94+row*.1],[.07,.015,.065]);for(let i=0;i<4;i++)box([0xb5a366,0x547798,0x986663][i%3],[-.98,1.37+i*.07,-1.1],[.45,.065,.5]);for(let i=0;i<5;i++)box(0x47747e,[.03,2.14-i*.12,-1.27],[.9-i*.1,.025,.01]);this.label(g,'THESIS.md',[.15,2.5,-1.35],1.5);
   this.cylinder(g,0x557285,[0,.48,.65],.38,.16);this.cylinder(g,0xa0aeb8,[0,.23,.65],.065,.45);
  }else if(prop==='blackjack'){
   buildBlackjackRoom(this,g);
  }else if(prop==='cards'||prop==='chess'){
   this.table(g,prop==='cards'?0x236c51:0x79694f);
   if(prop==='cards'){for(let i=0;i<5;i++){box(0xf4ead7,[(i-2)*.39,1.315,-1.10],[.30,.025,.43]);const l=this.label(g,['A','K','7','Q','5'][i],[(i-2)*.39,1.335,-1.10],.25,i%2?'#a53934':'#182e33');l.rotation.x=-Math.PI/2;}for(let i=0;i<3;i++)for(let j=0;j<3;j++)this.cylinder(g,[0xa94c42,0xd6be71,0x487fb0][i],[.85+i*.14,1.35+j*.035,-1.5],.07,.03);this.label(g,'PRACTICE TABLE',[0,2.4,-1.8],2.3);
   }else{for(let x=0;x<8;x++)for(let z=0;z<8;z++)box((x+z)%2?0x30404a:0xdfd5b6,[(x-3.5)*.18,1.32,-1.05+(z-3.5)*.13],[.18,.025,.13]);for(const side of [-1,1])for(let i=0;i<8;i++){const p=this.cylinder(g,side<0?0x253747:0xf0dfb7,[(i-3.5)*.18,1.42,-1.05+side*.33],.052,.16);if(i===3&&side===1)g.userData.piece=p;}}
  }else if(prop==='mat'){
   box(0x799f76,[0,.035,0],[2.8,.07,3.6]);for(const z of [-1.65,1.65])box(0xb4c99b,[0,.075,z],[2.7,.01,.04]);this.label(g,'BREATHE',[0,.8,-2],1.6);
  }else if(prop==='bed'){
   box(0x536e89,[0,.27,.3],[1.8,.5,3.1]);box(0xd9d7c6,[0,.57,.3],[1.75,.2,3]);box(0xf1e6cd,[0,.75,-.7],[1.35,.22,.65]);box(0x7994ae,[0,.73,.9],[1.73,.13,1.7]);box(0x526477,[0,.75,1.85],[1.9,1.4,.12]);
  }
  return g;
 }
 update(skill,clock,blackjack=null){
  const dt=Math.max(0,Math.min(.1,clock-(this.previousClock??clock)));this.previousClock=clock;
  const prop=skill?.presentation?.prop??'barbell';if(this.current!==prop){this.current=prop;this.started=clock;}
  const t=clock-this.started,bench=prop==='barbell';this.root.visible=!bench;this.accessories.visible=prop==='dumbbells';this.benchObjects.forEach(o=>o.visible=bench);
  this.fly.position.set(0,0,0);this.fly.rotation.set(0,0,0);this.cameraDistance=9.8;this.cameraHeight=1;
  if(bench){this.status='';return null;}
  const room=this.room(prop);for(const r of this.rooms.values())r.visible=r===room;
  const running=prop==='track',stairs=prop==='stairs',swim=prop==='pool',sleep=prop==='bed';
  const route=running?trackPath:swim?poolPath:()=>({x:0,y:stairs?.78:0,z:stairs?.22:0,yaw:0}),path=route(t);
  this.cameraDistance=running?21:swim?21:stairs?13:prop==='blackjack'?13:11;this.cameraHeight=stairs?1.7:1;
  const phase=t*(running?8:stairs?5:3),pulse=Math.sin(phase),height=swim?.56:sleep?1.03:1.80;
  const center=new THREE.Vector3(path.x,height+path.y+(running?.035*Math.abs(pulse):0),path.z);
  this.fly.rotation.set(sleep?0:swim?.07:Math.PI/2-(running?.15:prop==='books'?.15:0),path.yaw+(swim||sleep?0:Math.PI),0,'YXZ');if(prop==='mat')this.fly.rotation.z=.18*Math.sin(t*.8);
  this.fly.position.copy(center).sub(this.pivot.clone().applyEuler(this.fly.rotation));this.fly.updateMatrixWorld(true);
  const world=(x,y,z,p=path)=>new THREE.Vector3(p.x+Math.cos(p.yaw)*x+Math.sin(p.yaw)*z,y,p.z-Math.sin(p.yaw)*x+Math.cos(p.yaw)*z),local=v=>this.fly.worldToLocal(v).toArray();
  const handWorld=side=>{
   if(swim){const a=phase+(side>0?Math.PI:0);return world(side*(.5+.25*Math.sin(a)),.5+.20*Math.max(0,Math.cos(a)),-.6+.55*Math.cos(a));}
   if(sleep)return new THREE.Vector3(side*.45,1.08,-.4);
   if(prop==='dumbbells'){const spread=(1+Math.cos(t*2))*.5;return world(side*(.12+spread*.95),1.60,-.8+spread*.5);}
   if(prop==='kitchen')return side<0?world(-.55+.15*Math.cos(t*4),1.84,-1.05+.15*Math.sin(t*4)):world(.6,1.55+.10*Math.max(0,Math.sin(t*5)),-.90);
   if(prop==='books')return world(side*.28,1.40+.035*Math.max(0,Math.sin(t*9+side)),-.78);
   if(stairs)return world(side*1.04,2.56,-.33);
   if(prop==='blackjack')return world(side*.40,1.45+.035*Math.sin(t*2+side),-.55);
   if(prop==='cards'||prop==='chess')return world(side*.45,1.43+.06*Math.sin(t*2+side),-.65-.23*Math.max(0,Math.sin(t*1.5+side)));
   if(prop==='mat')return world(side*(.82+.07*pulse),1.15+.35*Math.sin(t*.8),-.12);
   return world(side*.52,1.36+path.y+.12*Math.sin(phase+side*Math.PI/2),-.35+.30*Math.sin(phase+side*Math.PI/2));
  };
  const feet=(side,index)=>{
   if(sleep)return [side*(.84+index*.18),.6,.77+index*.53];
   if(swim)return local(world(side*(.4+index*.18),.40+.07*Math.sin(phase*1.5+side+index),.5+index*.35+.2*Math.sin(phase+side)));
   if(stairs){const p=machineFoot(t,side,index);return local(new THREE.Vector3(p.x,p.y,p.z));}
   if(running){
    const period=running?.72:1.15,offset=(side>0?0:.5)+index*.5,cycle=t/period+offset,f=cycle-Math.floor(cycle),stance=.62,anchor=(Math.floor(cycle)-offset)*period+period*.24;
    let target;if(f<stance)target=world(side*(.30+index*.16),0,index*.22,route(anchor));
    else{const a=(f-stance)/(1-stance);target=world(side*(.30+index*.16),0,index*.22,route(anchor)).lerp(world(side*(.30+index*.16),0,index*.22,route(anchor+period)),a);target.y=Math.sin(Math.PI*a)*.27;}
    target.y+=.08;return local(target);
   }
   return local(world(side*(.40+index*.17),.06,index===0?-.02:.38));
  };
  if(prop==='dumbbells')this.handles.forEach((h,i)=>{const side=i?1:-1,w=handWorld(-side);h.position.set(...local(w.clone()));const a=room.userData.cables[i].geometry.attributes.position;a.setXYZ(0,-side*1.9,1.95,-.15);a.setXYZ(1,w.x,w.y,w.z);a.needsUpdate=true;room.userData.cables[i].geometry.computeBoundingSphere();});
  if(prop==='kitchen'){room.userData.spoon.position.copy(handWorld(-1));room.userData.spoon.rotation.z=.2*Math.sin(t*4);room.userData.knife.position.copy(handWorld(1));}
  if(prop==='chess'&&room.userData.piece)room.userData.piece.position.z=-.72-.26*(.5+.5*Math.sin(t*1.5));
  if(stairs)room.userData.treads.forEach((o,i)=>{const p=machineTread(t,i);o.position.set(p.x,p.y,p.z);o.visible=p.visible;});
  if(prop==='blackjack')updateBlackjackRoom(this,room,blackjack,dt);
  if(swim){const w=room.userData.wakes;w.position.set(path.x,.37,path.z);w.children.forEach((o,i)=>{o.scale.setScalar(.7+((t*.5+i*.2)%1));o.position.z=.2+i*.12;});}
  this.status=running?`Lap ${Math.floor(t*.30/TAU)+1} · oval circuit`:swim?`Length ${Math.floor(t*.8/(6+Math.PI*.55))+1} · lane turns`:stairs?`${Math.floor(t*STAIR_MACHINE.rate)} steps · revolving stair mill`:prop==='blackjack'?(blackjack?.phase==='thinking'?'Thinking: '+blackjack.decision?.action:'Dealer & fly · blackjack'):prop==='dumbbells'?'Standing cable fly':prop==='kitchen'?'Stir · chop · repeat':prop==='books'?'Read · type · revise':sleep?'Sleep & recover':prop==='mat'?'Standing stretch & balance':'Table practice';
  return {hand:side=>local(handWorld(swim||sleep?side:-side)),foot:(side,index)=>feet(swim||sleep?side:-side,index),legLengths:swim||sleep?null:[.97,.97]};
 }
}
