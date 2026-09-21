import {planWorkout} from '../workouts.mjs';
import { adaptedCost, clamp } from '../adaptation.mjs';

/** Each module owns its policy; the engine only executes this contract. */
export function defineSkill(config) {
  const skill = {
    duration: 20 * 60, baseCost: 14, fatigueCost: 10, gain: 1.4, interval: 8,
    floor: .25, signals: {}, ...config,
    createWorkout(state) { return planWorkout(this.id,state); },
    effortCost(state) { return adaptedCost(this.baseCost, state.mastery, this.floor); },
    train(state, amount) {
      return { ...state, mastery: clamp(state.mastery + this.gain * amount * (1 - state.mastery / 100)), sessions: state.sessions + amount };
    },
    needScore(state, hours) {
      const recoveryPressure = Math.max(state.stats.fatigue, 100 - state.stats.energy) / 100;
      const readiness = this.category === 'mental' ? 1 - recoveryPressure * .25 : 1 - recoveryPressure * .65;
      return clamp((.22 + Math.min(1, hours / this.interval) * .5 + (1 - state.mastery / 100) * .16) * readiness, 0, 1);
    },
    sessionEffects(state) {
      return { energy: -this.effortCost(state), fatigue: this.fatigueCost * (state.modifiers.fatigue[this.category] ?? 1) };
    },
    explain(state, hours) { return `${hours.toFixed(1)}h since practice · ${Math.round(state.mastery)}% mastery`; },
    ...config.methods,
  };
  delete skill.methods;
  return Object.freeze(skill);
}
