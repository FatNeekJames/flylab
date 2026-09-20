import test from 'node:test';
import assert from 'node:assert/strict';
import {ActivityCore,SIM_RATE,MAX_CATCHUP} from './core.mjs';
import {skills} from './skills/index.mjs';
import {adaptedCost,development} from './adaptation.mjs';
import {FlyEngine} from './engine.mjs';
import {FlyEngine as Legacy} from './tests/fixtures/legacy-engine.mjs';
import {NeuralModel,REGIONS,BIN} from './neural.mjs';
const core=()=>new ActivityCore(skills);

test('manual bench trajectories match the original engine exactly',()=>{
 for(const weight of [20,140,200,215,315,500])for(const single of [false,true]){
  const a=new FlyEngine(),b=new Legacy();a.load(weight);b.load(weight);a.start(single);b.start(single);
  for(let frame=0;frame<2000;frame++){
   if(frame===20){a.pushing=true;b.pushing=true}if(frame===180){a.pushing=false;b.pushing=false}if(frame===1400){a.rest();b.rest()}
   a.step(.015);b.step(.015);
   for(const key of ['weight','energy','reps','best','running','single','phase','position','pushing','effort','stall','resting','event','version','capacity'])assert.equal(a[key],b[key],`${weight}/${single}/${frame}/${key}`);
  }
 }
});
test('all twelve independent modules implement the complete contract',()=>{const c=core();assert.equal(c.skills.size,12);for(const skill of skills){assert.ok(['physical','mental','endurance'].includes(skill.category));const state=c.context(skill.id),next=skill.train(state,1);assert.ok(next.mastery>0);assert.equal(state.mastery,0);assert.ok(skill.needScore(state,12)>=0&&skill.needScore(state,12)<=1);assert.ok(Number.isFinite(skill.effortCost(state)))}});
test('adaptation monotonically approaches a nonzero cost floor',()=>{let prev=Infinity;for(let mastery=0;mastery<1000;mastery++){const cost=adaptedCost(20,mastery);assert.ok(cost<=prev);assert.ok(cost>=5);prev=cost}assert.equal(adaptedCost(20,0),20);assert.ok(Math.abs(prev-5)<1e-9);assert.throws(()=>adaptedCost(20,0,0))});
test('generic scheduler accepts a previously unknown skill without core edits',()=>{const c=new ActivityCore([{id:'new-skill',label:'Novel',category:'mental',duration:60,effortCost:()=>1,train:s=>({...s,mastery:s.mastery+1,sessions:s.sessions+1}),needScore:()=>1}]);assert.equal(c.choose(),'new-skill');c.setMode('auto');c.advance(120);assert.equal(c.states['new-skill'].sessions,2);assert.equal(c.stats.energy,98)});
test('a physical and a cognitive session use the same executor',()=>{for(const id of ['chest-flies','stairmaster','marathon','swimming','blackjack','poker','chess','phd']){const c=core();assert.ok(c.start(id));const before=c.stats.energy,duration=c.current.duration;c.advance(duration/2);assert.ok(c.stats.energy<before);assert.equal(c.states[id].sessions,0);c.advance(duration/2);assert.equal(c.states[id].sessions,1);assert.ok(c.states[id].mastery>0);assert.equal(c.current,null)}});
test('yoga reduces other physical fatigue, not mental fatigue',()=>{const c=core(),physical=skills.find(s=>s.id==='chest-flies'),mental=skills.find(s=>s.id==='chess');const p=physical.sessionEffects(c.context(physical.id)),m=mental.sessionEffects(c.context(mental.id));c.states.yoga.mastery=100;assert.ok(physical.sessionEffects(c.context(physical.id)).fatigue<p.fatigue);assert.equal(mental.sessionEffects(c.context(mental.id)).fatigue,m.fatigue)});
test('cooking shortens recovery while rest is a normal schedulable module',()=>{const c=core(),rest=c.skills.get('rest'),base=rest.sessionDuration(c.context('rest'));c.states.cooking.mastery=100;assert.ok(rest.sessionDuration(c.context('rest'))<base);c.stats={energy:8,fatigue:95};c.setMode('auto');assert.equal(c.choose(),'rest');c.advance(3000);assert.ok(c.stats.energy>8);assert.ok(c.stats.fatigue<95)});
test('PhD has a much longer mastery horizon than chess and poker',()=>{const c=core();for(let i=0;i<20;i++)for(const id of ['phd','chess','poker'])c.recordTraining(id);assert.ok(c.states.phd.mastery<c.states.chess.mastery/8);assert.ok(c.states.chess.mastery<c.states.poker.mastery)});
test('all-skill development grows for mental practice and is bounded',()=>{const c=core();c.recordTraining('phd',10);assert.ok(c.development.growth>0);const before=c.development.growth;c.recordTraining('swimming',5);assert.ok(c.development.growth>before);assert.ok(c.development.growth<1);assert.equal(c.development.practiced,2);assert.equal(development({}).growth,0)});
test('autonomy balances a multi-day schedule without exhausted infinite loops',()=>{const c=core();c.setMode('auto');c.advance(7*86400);for(const id of c.skills.keys())assert.ok(c.states[id].sessions>0,`${id} was starved`);assert.ok(c.completed>100);assert.ok(c.stats.energy>=0&&c.stats.energy<=100);assert.ok(c.stats.fatigue>=0&&c.stats.fatigue<=100);assert.equal(c.history.length,24)});
test('nudge chooses a feasible next activity, not an impossible one',()=>{const c=core();c.setMode('auto');c.nudge='phd';assert.equal(c.choose(),'phd');c.advance(1);assert.equal(c.current.id,'phd');assert.equal(c.nudge,null);c.current=null;c.stats.energy=0;c.nudge='marathon';assert.equal(c.choose(),'rest')});
test('manual mode never schedules unsolicited sessions',()=>{const c=core();c.lastWall=1000;c.wallTick(900000);assert.equal(c.completed,0);assert.equal(c.current,null);assert.equal(c.stats.energy,100)});
test('wall-time tick and catch-up are deterministic across reloads',()=>{const a=core();a.setMode('auto');a.wallTick(1000);a.wallTick(12000);const b=core();assert.ok(b.restore(a.serialize()));a.wallTick(91000);b.wallTick(91000);assert.equal(a.serialize(),b.serialize());assert.ok(b.completed>0)});
test('catch-up is bounded and backwards clock does not award time',()=>{const c=core();c.setMode('auto');c.wallTick(100000);c.wallTick(50000);assert.equal(c.time,0);c.wallTick(100000);assert.equal(c.time,0);c.wallTick(100000+(MAX_CATCHUP+100000)*1000);assert.ok(Math.abs(c.time-MAX_CATCHUP*SIM_RATE)<1e-6);assert.equal(c.catchup.capped,true)});
test('invalid saves fail safely and partial sessions preserve exact progress',()=>{const c=core();assert.equal(c.restore('{bad'),false);assert.equal(c.restore('{"version":999}'),false);c.start('chess');c.advance(123);const b=core();assert.ok(b.restore(c.serialize()));assert.deepEqual(b.current,c.current);assert.deepEqual(b.stats,c.stats);b.advance(1197);assert.equal(b.states.chess.sessions,1)});
test('switching to manual stops autonomy without granting unfinished mastery',()=>{const c=core();c.setMode('auto');c.advance(3);const id=c.current.id,energy=c.stats.energy;c.setMode('manual');c.advance(10000);assert.equal(c.current,null);assert.equal(c.states[id].sessions,0);assert.equal(c.stats.energy,energy)});
test('new neural mappings keep 384 units and distinguish thought from locomotion',()=>{assert.equal(REGIONS.reduce((n,r)=>n+r.count,0),384);const simulate=signal=>{const n=new NeuralModel(),counts=new Array(8).fill(0);for(let i=0;i<400;i++){n.step(BIN,{running:false,effort:0,activitySignal:signal});n.raster[(n.cursor+199)%200].forEach((v,k)=>counts[n.neurons[k].group]+=v)}return counts};const cards=simulate({motor:0,learning:.6,decision:1}),run=simulate({motor:1,learning:.6,decision:0});assert.ok(cards[7]>run[7]*2);assert.ok(run[6]>cards[6]*2)});

test('manual recovery preserves independent fatigue after cognitive activity',()=>{
 const c=core(),e=new FlyEngine(c);c.stats.energy=70;c.stats.fatigue=10;e.step(.1);
 assert.ok(c.stats.energy>70);assert.ok(c.stats.fatigue<10);assert.ok(c.stats.fatigue>9);
});
test('embedded VFB names and IDs exactly match the research snapshot',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {VFB_REGIONS}=await import('./brain-view.js');
 const snapshot=JSON.parse(await readFile('data/vfb-regions.json','utf8'));
 assert.equal(Object.keys(VFB_REGIONS).length,7);
 for(const region of Object.values(VFB_REGIONS))assert.ok(snapshot.terms.some(t=>t.id===region.id&&t.label===region.name));
});
