import { defineSkill } from './shared.mjs';
export const skill = defineSkill({
  "id": "phd",
  "label": "PhD studies",
  "category": "mental",
  "baseCost": 12,
  "fatigueCost": 5,
  "gain": 0.08,
  "duration": 3000,
  "interval": 12,
  "signals": {
    "learning": 1
  },
  "presentation": {
    "motion": "study",
    "prop": "books"
  }
});
export default skill;
