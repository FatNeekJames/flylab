import { defineSkill } from './shared.mjs';
export const skill = defineSkill({
  "id": "chess",
  "label": "Chess",
  "category": "mental",
  "baseCost": 10,
  "fatigueCost": 4,
  "gain": 1.1,
  "duration": 1320,
  "interval": 8,
  "signals": {
    "decision": 0.55
  },
  "presentation": {
    "motion": "think",
    "prop": "chess"
  }
});
export default skill;
