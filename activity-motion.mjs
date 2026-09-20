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
export const STAIR_MACHINE={rate:.85,depth:.48,rise:.24,count:8};
export function machineTread(t,index){const q=((index-t*STAIR_MACHINE.rate)%8+8)%8;return {x:0,y:.22+q*.24,z:1.4-q*.48,visible:q<6};}
export function machineFoot(t,side,index){
 const offset=(side>0?0:.5)+index*.5,cycle=t*STAIR_MACHINE.rate+offset,k=Math.floor(cycle),f=cycle-k,stance=.62,start=k-offset,tread=Math.round(2.3+start);
 let point;
 if(f<stance)point=machineTread(t,tread);
 else{const a=(f-stance)/(1-stance),from=machineTread((start+stance)/STAIR_MACHINE.rate,tread),to=machineTread((start+1)/STAIR_MACHINE.rate,Math.round(2.3+start+1));point={y:from.y+(to.y-from.y)*a+Math.sin(Math.PI*a)*.32,z:from.z+(to.z-from.z)*a};}
 return {x:side*(.30+index*.13),y:point.y+.025,z:point.z,stance:f<stance};
}
export function solveLimb(root,requested,upper,lower,side=1){
 const delta=requested.map((v,i)=>v-root[i]),raw=Math.hypot(...delta),d=raw>1e-8?delta.map(v=>v/raw):[0,-1,0];
 const length=Math.max(Math.abs(upper-lower)+1e-5,Math.min(upper+lower-1e-5,raw)),end=root.map((v,i)=>v+d[i]*length);
 const along=(length*length+upper*upper-lower*lower)/(2*length),h=Math.sqrt(Math.max(0,upper*upper-along*along));
 let bend=[side,.15,.25],dot=bend.reduce((s,v,i)=>s+v*d[i],0);bend=bend.map((v,i)=>v-dot*d[i]);let n=Math.hypot(...bend);
 if(n<1e-6){bend=[0,0,1];dot=d[2];bend=bend.map((v,i)=>v-dot*d[i]);n=Math.hypot(...bend);}
 return {end,joint:root.map((v,i)=>v+d[i]*along+bend[i]/n*h)};
}
