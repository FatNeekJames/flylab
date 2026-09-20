import { defineSkill } from './shared.mjs';
export const skill = defineSkill({
  "id": "marathon",
  "label": "Marathon training",
  "category": "endurance",
  "baseCost": 26,
  "fatigueCost": 20,
  "gain": 1.3,
  "duration": 2100,
  "interval": 12,
  "signals": {
    "motor": 1
  },
  "presentation": {
    "motion": "run",
    "prop": "track"
  }
});
export default skill;
