import { defineSkill } from './shared.mjs';
export const skill = defineSkill({
  "id": "blackjack",
  "label": "Blackjack",
  "category": "mental",
  "baseCost": 8,
  "fatigueCost": 3,
  "gain": 2.1,
  "duration": 720,
  "interval": 5,
  "signals": {
    "decision": 1
  },
  "presentation": {
    "motion": "think",
    "prop": "cards"
  }
});
export default skill;
