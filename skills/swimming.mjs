import { defineSkill } from './shared.mjs';
export const skill = defineSkill({
  "id": "swimming",
  "label": "Swimming",
  "category": "endurance",
  "baseCost": 22,
  "fatigueCost": 16,
  "gain": 1.5,
  "duration": 1680,
  "interval": 10,
  "signals": {
    "motor": 1
  },
  "presentation": {
    "motion": "swim",
    "prop": "pool"
  }
});
export default skill;
