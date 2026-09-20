import { clamp } from '../adaptation.mjs';
import { defineSkill } from './shared.mjs';
export const skill = defineSkill({
  "id": "bench-press",
  "label": "Bench press",
  "category": "physical",
  "baseCost": 18,
  "fatigueCost": 15,
  "gain": 1.6,
  "duration": 1200,
  "interval": 8,
  "signals": {
    "motor": 1
  },
  "presentation": {
    "motion": "press",
    "prop": "barbell"
  }
});
export default skill;

// Manual mechanic deliberately retains the original numerical behavior.
export class BenchPressMechanic {
 constructor(core){this.core=core;this.reset()}
 get energy(){return this.core.stats.energy}
 set energy(value){this.core.stats.fatigue=clamp(this.core.stats.fatigue+this.core.stats.energy-value);this.core.stats.energy=value}
 reset(){this.weight=140;this.energy=100;this.reps=0;this.best=0;this.running=false;this.single=false;this.phase=0;this.position=1;this.pushing=false;this.effort=0;this.stall=0;this.resting=false;this.event='Ready';this.version=0}
 get capacity(){return (205+Math.min(45,this.reps*.7))*(.58+.42*this.energy/100)*(this.pushing?1.24:1)}
 load(w){if(!Number.isFinite(w))return;this.weight=Math.max(20,Math.min(500,Math.round(w/5)*5));this.stall=0}
 start(single=false){this.running=true;this.single=single;this.resting=false;this.phase=0;this.stall=0;this.event=single?'One rep. Everything you have.':'Let’s get to work.';this.version++}
 rest(){this.running=false;this.resting=true;this.pushing=false;this.position=1;this.event='Bar racked. Catching six-legged breath.';this.version++}
 step(dt){dt=Math.min(.1,Math.max(0,dt));if(!this.running){this.energy=Math.min(100,this.energy+dt*(this.resting?6:1.5));this.effort=Math.max(0,this.effort-dt*80);return}
 const ratio=this.weight/this.capacity;this.effort=Math.min(100,ratio*82+(this.pushing?14:0));this.energy=Math.max(0,this.energy-dt*(1.2+ratio*2.4+(this.pushing?3:0)));
 if(this.phase<.5){this.phase+=dt*.42;this.position=1-Math.min(1,this.phase*2)}else if(ratio<=1){this.phase+=dt*Math.max(.065,.58*(1-ratio*.78));this.position=Math.min(1,(this.phase-.5)*2);this.stall=0}else{this.position=Math.max(.04,this.position-dt*.15);this.stall+=dt;if(this.stall>2.2){this.running=false;this.resting=true;this.event='No lift. The safety arms caught it. Rest or drop the weight.';this.version++}}
 if(this.phase>=1){this.reps++;this.core.recordTraining(skill.id,.1);this.best=Math.max(this.best,this.weight);this.phase=0;this.position=1;this.event=`${this.weight} lb locked out. ${this.single?'One-rep attempt complete!':'Clean rep. Keep going.'}`;this.version++;if(this.single){this.running=false;this.resting=true}}
 }
}
