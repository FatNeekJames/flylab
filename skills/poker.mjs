import { defineSkill } from './shared.mjs';
export const skill = defineSkill({
  "id": "poker",
  "label": "Poker",
  "category": "mental",
  "baseCost": 10,
  "fatigueCost": 4,
  "gain": 1.5,
  "duration": 1080,
  "interval": 6,
  "signals": {
    "decision": 1
  },
  "presentation": {
    "motion": "think",
    "prop": "cards"
  }
});
export default skill;
