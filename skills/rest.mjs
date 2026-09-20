import { defineSkill } from './shared.mjs';
export const skill = defineSkill({
  "id": "rest",
  "label": "Rest & sleep",
  "category": "physical",
  "baseCost": 0,
  "fatigueCost": 0,
  "gain": 0.5,
  "duration": 2400,
  "interval": 1,
  "signals": {},
  "presentation": {
    "motion": "sleep",
    "prop": "bed"
  },
 methods: {
  sessionDuration(s) { return this.duration/s.modifiers.recovery; },
  sessionEffects(s) { return {energy:60,fatigue:-65}; },
  needScore(s,h) { return Math.min(1,.04+Math.max(s.stats.fatigue/100,(100-s.stats.energy)/100)*1.18); },
  explain(s,h) { return `${Math.round(s.stats.energy)}% energy · ${Math.round(s.stats.fatigue)}% fatigue: recovery need`; }
 }
});
export default skill;
