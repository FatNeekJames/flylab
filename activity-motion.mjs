// Deterministic presentation paths and fixed-length inverse kinematics.
export const TAU=Math.PI*2;
export function trackPath(t){const a=t*.30;return {x:4.2*Math.cos(a),z:2.65*Math.sin(a),y:0,yaw:Math.atan2(4.2*Math.sin(a),-2.65*Math.cos(a))};}
export function poolPath(t){
 const r=.55,straight=6,arc=Math.PI*r,length=2*(straight+arc),d=((t*.8)%length+length)%length;
 if(d<straight)return {x:-r,z:3-d,y:0,yaw:0};
 if(d<straight+arc){const a=(d-straight)/r;return {x:-r*Math.cos(a),z:-3-r*Math.sin(a),y:0,yaw:-a};}
 if(d<2*straight+arc)return {x:r,z:-3+d-straight-arc,y:0,yaw:Math.PI};
 const a=(d-2*straight-arc)/r;return {x:r*Math.cos(a),z:3+r*Math.sin(a),y:0,yaw:Math.PI-a};
}
export function stairHeight(z){return Math.max(0,Math.min(8,Math.floor((2.8-z)/.65)+1))*.20;}
export function stairPath(t){const p=poolPath(t*.72),z=p.z*.92;return {...p,x:p.x*2.5,z,yaw:Math.atan2(2.5*Math.sin(p.yaw),.92*Math.cos(p.yaw)),y:Array.from({length:8},(_,i)=>{const u=Math.max(0,Math.min(1,(2.8-z-i*.65+.16)/.32));return .20*u*u*(3-2*u);}).reduce((a,b)=>a+b,0)};}
export function solveLimb(root,requested,upper,lower,side=1){
 const delta=requested.map((v,i)=>v-root[i]),raw=Math.hypot(...delta),d=raw>1e-8?delta.map(v=>v/raw):[0,-1,0];
 const length=Math.max(Math.abs(upper-lower)+1e-5,Math.min(upper+lower-1e-5,raw)),end=root.map((v,i)=>v+d[i]*length);
 const along=(length*length+upper*upper-lower*lower)/(2*length),h=Math.sqrt(Math.max(0,upper*upper-along*along));
 let bend=[side,.15,.25],dot=bend.reduce((s,v,i)=>s+v*d[i],0);bend=bend.map((v,i)=>v-dot*d[i]);let n=Math.hypot(...bend);
 if(n<1e-6){bend=[0,0,1];dot=d[2];bend=bend.map((v,i)=>v-dot*d[i]);n=Math.hypot(...bend);}
 return {end,joint:root.map((v,i)=>v+d[i]*along+bend[i]/n*h)};
}
