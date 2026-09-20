// Scene units. Hook top + bar radius equals the resting bar centre.
export const BENCH={barRadius:.045,bottom:1.48,lockout:2.08,rack:1.895,rackZ:-.76,liftZ:-.38,hookTop:1.85,lipTop:1.98,safetyTop:1.435,upperLeg:.70,lowerLeg:.67};
const lerp=(a,b,t)=>a+(b-a)*t;
export class BenchMotion {
 constructor(){this.reset()}
 reset(){this.y=BENCH.rack;this.z=BENCH.rackZ;this.mode='racked';this.time=0;this.assisted=false}
 start(engine,single=false){if(this.mode==='unracking'||this.mode==='racking')return;this.assisted=false;engine.start(single);this.mode='unracking';this.time=0;this.fromY=this.y;this.fromZ=this.z;if(this.y<BENCH.rack-.1)this.assisted=true}
 rack(engine,recover=false){const needsAssist=this.mode==='failed'||(this.y<BENCH.lockout-.1&&engine.weight>engine.capacity);if(recover)engine.rest();else{engine.running=false;engine.position=1;engine.event='Returning the bar to the hooks.';engine.version++}this.assisted=needsAssist;this.mode='racking';this.time=0;this.fromY=this.y;this.fromZ=this.z;if(needsAssist){engine.event='Rack assist engaged. Recovering the bar from the safety arms.';engine.version++}}
 step(engine,dt){dt=Math.min(.05,dt);if(this.mode==='unracking'||this.mode==='racking'){
  this.time+=dt;const t=Math.min(1,this.time/1.2),a=Math.min(1,t*3),b=Math.max(0,Math.min(1,t*3-1)),c=Math.max(0,t*3-2);
  this.y=lerp(this.fromY,BENCH.lockout,a);this.z=lerp(this.fromZ,this.mode==='unracking'?BENCH.liftZ:BENCH.rackZ,b);
  if(this.mode==='racking')this.y=lerp(BENCH.lockout,BENCH.rack,c);
  if(t===1){this.mode=this.mode==='unracking'?'lifting':'racked';this.assisted=false}return;
 }
 engine.step(dt);
 if(this.mode==='lifting'){
  this.y=BENCH.bottom+engine.position*(BENCH.lockout-BENCH.bottom);this.z=BENCH.liftZ;
  if(!engine.running){if(engine.stall>2.2){this.mode='failed';this.y=BENCH.bottom}else{const event=engine.event;this.rack(engine,true);engine.event=event}}
 }
 }
}
// Two fixed-length limb segments, solved in the shoulder/target bend plane.
export function elbowFor(shoulder,target,side){const delta=target.map((v,i)=>v-shoulder[i]),distance=Math.hypot(...delta),d=delta.map(v=>v/distance),length=Math.min(distance,BENCH.upperLeg+BENCH.lowerLeg-1e-6);const along=(length*length+BENCH.upperLeg**2-BENCH.lowerLeg**2)/(2*length);const height=Math.sqrt(Math.max(0,BENCH.upperLeg**2-along**2));let bend=[side,0,.25];const dot=bend.reduce((n,v,i)=>n+v*d[i],0);bend=bend.map((v,i)=>v-dot*d[i]);const n=Math.hypot(...bend);return shoulder.map((v,i)=>v+d[i]*along+bend[i]/n*height)}
