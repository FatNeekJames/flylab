// Game training progression, not a prescription for human exercise.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function planWorkout(id,context){
 const supported=['bench-press','chest-flies','marathon','swimming','stairmaster'];if(!supported.includes(id))return null;
 const n=context.workouts?.progress||0,completed=context.workouts?.completed||0;
 const deload=context.stats.energy<55||context.stats.fatigue>55||(completed>0&&completed%5===0);
 if(id==='bench-press'||id==='chest-flies'){
  const mode=n%3,sets=deload?2:[4,5,3][mode],reps=deload?8:[10,5,12][mode],rest=mode===1?180:120,repSeconds=5;
  const base=id==='bench-press'?140:20,increment=id==='bench-press'?5:2.5;
  const weight=clamp(Math.round((base+Math.floor(n/3)*increment+(mode===1?increment*3:mode===2?-increment:0))*(deload?.8:1)/increment)*increment,increment,id==='bench-press'?400:100);
  const duration=180+sets*(reps*repSeconds+6)+(sets-1)*rest;
  return {kind:'strength',label:deload?'Recovery session':['Hypertrophy','Strength · 5 × 5','Volume'][mode],sets,reps,weight,rest,repSeconds,warmup:180,duration,deload,multiplier:deload?.65:1+Math.min(.6,n*.02),reason:deload?'Reduced workload for fatigue or a scheduled recovery session.':'Complete the workout to progress. Every three successful sessions raises the working load.'};
 }
 const distance=id==='marathon'?Math.min(42.2,3*Math.pow(1.05,n)):id==='swimming'?Math.min(5,.4*Math.pow(1.05,n)):0;
 const pace=id==='marathon'?Math.min(14,8+n*.08):id==='swimming'?Math.min(2,.8+n*.01):Math.min(90,51+Math.floor(n/2));
 const duration=id==='stairmaster'?Math.min(3600,1320*Math.pow(1.05,n)):(distance/pace)*3600;
 const seconds=Math.round(duration*(deload?.65:1));const target=id==='stairmaster'?Math.floor(seconds/60*pace):+(distance*(deload?.65:1)).toFixed(3);
 return {kind:'endurance',label:deload?'Easy recovery':n%3===2?'Long endurance':'Progressive endurance',duration:seconds,target,unit:id==='stairmaster'?'steps':'km',pace,deload,multiplier:deload?.6:1+Math.min(.8,n*.035),reason:deload?'Shorter recovery effort; the next hard target stays unchanged.':'Finish the full target to increase distance or duration by 5% next time, up to the activity limit.'};
}
export function workoutProgress(plan,elapsed){
 const t=clamp(elapsed,0,plan.duration);
 if(plan.kind==='endurance'){const done=plan.target*t/plan.duration;return {phase:'training',fraction:t/plan.duration,done,label:`${plan.unit==='km'?done.toFixed(2):Math.floor(done)} / ${plan.target} ${plan.unit} · ${plan.pace.toFixed(1)} ${plan.unit==='km'?'km/h':'steps/min'}`}}
 let remaining=t-plan.warmup;if(remaining<0)return {phase:'warmup',set:0,reps:0,position:1,label:`Warm-up · ${Math.ceil(-remaining)}s`};
 let done=0;for(let set=1;set<=plan.sets;set++){
  if(remaining<3)return {phase:'unrack',set,reps:done,transition:remaining/3,position:1,label:`Set ${set}/${plan.sets} · unracking`};remaining-=3;
  const work=plan.reps*plan.repSeconds;
  if(remaining<work){const rep=Math.floor(remaining/plan.repSeconds),phase=remaining/plan.repSeconds-rep;return {phase:'lifting',set,reps:done+rep,position:(1+Math.cos(phase*Math.PI*2))/2,label:`Set ${set}/${plan.sets} · rep ${rep+1}/${plan.reps} · ${plan.weight} lb`}}remaining-=work;done+=plan.reps;
  if(remaining<3)return {phase:'rack',set,reps:done,transition:remaining/3,position:1,label:`Set ${set}/${plan.sets} · racking`};remaining-=3;
  if(set<plan.sets&&remaining<plan.rest)return {phase:'rest',set,reps:done,position:1,label:`Rest ${Math.ceil(plan.rest-remaining)}s · ${done}/${plan.sets*plan.reps} reps completed`};if(set<plan.sets)remaining-=plan.rest;
 }
 return {phase:'complete',set:plan.sets,reps:done,position:1,label:`Completed ${plan.sets} × ${plan.reps} at ${plan.weight} lb`};
}
export function workoutSummary(p){return p.kind==='strength'?`${p.label} · ${p.sets} × ${p.reps} · ${p.weight} lb${p.weight<100?' per handle':''}`:`${p.label} · ${p.target} ${p.unit} · ${Math.round(p.duration/60)} min`}
