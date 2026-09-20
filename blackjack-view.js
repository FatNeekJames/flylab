import * as THREE from 'three';
export function buildBlackjackRoom(view,g){
 const box=(c,p,s)=>view.box(g,c,p,s);
 const felt=view.cylinder(g,0x20654e,[0,1.15,-1.45],1,.22);felt.scale.set(2.3,1,1.7);
 const rim=view.cylinder(g,0x6a493a,[0,1.07,-1.45],1,.22);rim.scale.set(2.43,1,1.8);
 for(const x of [-1.6,1.6])box(0x263e49,[x,.54,-1.5],[.16,1.08,.25]);
 box(0x283e56,[1.6,1.34,-2.3],[.38,.20,.65]);view.label(g,'BLACKJACK  3:2',[0,1.28,-1.42],1.8).rotation.x=-Math.PI/2;
 const dealer=new THREE.Group();dealer.position.set(0,0,-3.3);g.add(dealer);
 view.box(dealer,0x24343f,[0,1.66,0],[.72,.82,.37]);view.box(dealer,0xe2d5bd,[0,1.76,.20],[.35,.55,.025]);view.box(dealer,0x773f35,[0,1.83,.23],[.07,.37,.025]);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.26,24,16),view.material(0xc89c68));head.position.set(0,2.3,.04);dealer.add(head);
 for(const x of [-.09,.09])view.box(dealer,0x182e3e,[x,2.32,.285],[.035,.035,.018]);
 const arms=[-1,1].map(side=>{const upper=view.line(g,[[0,0,0],[0,1,0]],0x526577,.065),lower=view.line(g,[[0,0,0],[0,1,0]],0xc89c68,.055);upper.geometry.translate(0,-.5,0);lower.geometry.translate(0,-.5,0);return {side,upper,lower};});
 view.label(g,'DEALER',[0,2.85,-3.3],1.2);
 g.userData.blackjack={cards:new Map(),arms,materials:new Map()};
}
const axis=new THREE.Vector3(0,1,0);
function limb(mesh,a,b){const d=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=d.length();mesh.quaternion.setFromUnitVectors(axis,d.normalize());}
function faceMaterial(view,room,c){
 const cache=room.userData.blackjack.materials,key=c.hidden?'back':`${c.rank}${c.suit}`;if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=180;const ctx=canvas.getContext('2d');ctx.fillStyle=c.hidden?'#315880':'#f5ecd4';ctx.fillRect(0,0,128,180);ctx.strokeStyle=c.hidden?'#80a9c5':'#c4bba2';ctx.lineWidth=5;ctx.strokeRect(5,5,118,170);ctx.fillStyle=['♥','♦'].includes(c.suit)?'#b13f39':'#19333e';ctx.font='bold 37px monospace';ctx.textAlign='center';ctx.fillText(c.hidden?'FL':c.rank,64,60);ctx.font='57px serif';ctx.fillText(c.hidden?'✳':c.suit,64,130);
 const m=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),side:THREE.DoubleSide});cache.set(key,m);return m;
}
export function updateBlackjackRoom(view,room,state,dt){
 if(!state)return;const data=room.userData.blackjack,items=[];
 state.dealer.forEach((c,i)=>items.push({c,pos:[(i-(state.dealer.length-1)/2)*.37,1.285,-2.28]}));
 state.hands.forEach((h,hi)=>h.cards.forEach((c,i)=>{const spread=state.hands.length>1?1.05:0,x=(hi-(state.hands.length-1)/2)*spread+(i-(h.cards.length-1)/2)*Math.min(.32,.75/Math.max(1,h.cards.length-1));items.push({c,pos:[x,1.29+hi*.002,-.55]});}));
 const present=new Set(items.map(i=>i.c.id));for(const [id,mesh] of data.cards)if(!present.has(id)){room.remove(mesh);mesh.geometry.dispose();data.cards.delete(id);}
 let handTarget=new THREE.Vector3(.6,1.4,-2.3),newest=-Infinity;
 for(const {c,pos} of items){let mesh=data.cards.get(c.id);if(!mesh){mesh=new THREE.Mesh(new THREE.PlaneGeometry(.31,.43),faceMaterial(view,room,c));mesh.rotation.x=-Math.PI/2;mesh.position.set(1.6,1.47,-2.3);room.add(mesh);data.cards.set(c.id,mesh);}mesh.material=faceMaterial(view,room,c);
  const age=Math.max(0,state.time-c.dealtAt),a=Math.min(1,age/.52),target=new THREE.Vector3(...pos),from=new THREE.Vector3(1.6,1.47,-2.3);
  if(a<1){mesh.position.copy(from.lerp(target,a));mesh.position.y+=Math.sin(a*Math.PI)*.18;}else mesh.position.lerp(target,Math.min(1,dt*12));
  if(c.dealtAt>newest&&age<.7){newest=c.dealtAt;handTarget.copy(mesh.position).add(new THREE.Vector3(0,.10,0));}
 }
 handTarget.z=Math.min(-1.7,handTarget.z);
 for(const {side,upper,lower} of data.arms){const shoulder=new THREE.Vector3(side*.42,1.92,-3.3),elbow=new THREE.Vector3(side*.62,1.50,-2.77),end=side>0?handTarget:new THREE.Vector3(-.65,1.38,-2.37);limb(upper,shoulder,elbow);limb(lower,elbow,end);}
}
