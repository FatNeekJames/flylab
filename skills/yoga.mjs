import { defineSkill } from './shared.mjs';
export const skill = defineSkill({
  "id": "yoga",
  "label": "Yoga & stretching",
  "category": "physical",
  "baseCost": 6,
  "fatigueCost": 0,
  "gain": 1.5,
  "duration": 900,
  "interval": 6,
  "signals": {
    "motor": 0.35
  },
  "presentation": {
    "motion": "stretch",
    "prop": "mat"
  },
 methods: {
  sessionEffects(s) { return {energy:-this.effortCost(s),fatigue:-8}; },
  modifiers(s) { return {fatigue:{physical:1-.3*s.mastery/100}}; },
  needScore(s,h) { return Math.min(.95,.18+Math.min(1,h/6)*.26+s.stats.fatigue/100*.32); },
  explain(s,h) { return `Stretching eases fatigue; physical fatigue discount ${(s.mastery*.3).toFixed(1)}%`; }
 }
});
export default skill;
