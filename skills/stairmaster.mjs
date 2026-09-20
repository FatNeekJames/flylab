import { defineSkill } from './shared.mjs';
export const skill = defineSkill({
  "id": "stairmaster",
  "label": "Stairmaster",
  "category": "physical",
  "baseCost": 19,
  "fatigueCost": 14,
  "gain": 1.5,
  "duration": 1320,
  "interval": 7,
  "signals": {
    "motor": 1
  },
  "presentation": {
    "motion": "step",
    "prop": "stairs"
  }
});
export default skill;
