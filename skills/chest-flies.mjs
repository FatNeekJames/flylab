import { defineSkill } from './shared.mjs';
export const skill = defineSkill({
  "id": "chest-flies",
  "label": "Chest flies",
  "category": "physical",
  "baseCost": 15,
  "fatigueCost": 12,
  "gain": 1.7,
  "duration": 1080,
  "interval": 7,
  "signals": {
    "motor": 0.9
  },
  "presentation": {
    "motion": "fly",
    "prop": "dumbbells"
  }
});
export default skill;
