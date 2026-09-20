import { defineSkill } from './shared.mjs';
export const skill = defineSkill({
  "id": "cooking",
  "label": "Cooking",
  "category": "mental",
  "baseCost": 7,
  "fatigueCost": 2,
  "gain": 1.4,
  "duration": 960,
  "interval": 8,
  "signals": {
    "learning": 0.5
  },
  "presentation": {
    "motion": "cook",
    "prop": "kitchen"
  },
 methods: {
  modifiers(s) { return {recovery:1+.6*s.mastery/100}; },
  needScore(s,h) { return Math.min(.9,.18+Math.min(1,h/8)*.4+(1-s.mastery/100)*.13); },
  explain(s,h) { return `Practice shortens future recovery · ${(s.mastery*.6).toFixed(1)}% recovery speed bonus`; }
 }
});
export default skill;
