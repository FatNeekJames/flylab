import { clamp, development } from './adaptation.mjs';

export const SIM_RATE = 1; // real time by default
export const MAX_CATCHUP = 24 * 60 * 60; // real seconds: bounded to one day
export const SAVE_VERSION = 1;
const emptyState = () => ({ mastery: 0, sessions: 0, lastSession: null });

export class ActivityCore {
  constructor(skills = []) {
    this.skills = new Map();
    for (const skill of skills) this.register(skill);
    this.reset();
  }
  register(skill) {
    if (!skill.id || !skill.label || !['physical', 'mental', 'endurance'].includes(skill.category) ||
      !['effortCost', 'train', 'needScore'].every(k => typeof skill[k] === 'function')) throw new TypeError('Invalid skill contract');
    if (this.skills.has(skill.id)) throw new Error(`Duplicate skill: ${skill.id}`);
    this.skills.set(skill.id, skill);
    if (this.states) this.states[skill.id] = emptyState();
    return this;
  }
  reset() {
    this.stats = { energy: 100, fatigue: 0 };
    this.states = Object.fromEntries([...this.skills.keys()].map(id => [id, emptyState()]));
    this.time = 0; this.mode = 'manual'; this.selected = this.skills.keys().next().value;
    this.current = null; this.nudge = null; this.history = []; this.completed = 0;
    this.speed = 1; this.lastWall = null; this.lastGain = 0; this.catchup = null;
  }
  modifiers() {
    const result = { fatigue: {}, recovery: 1 };
    for (const [id, skill] of this.skills) {
      const mods = skill.modifiers?.(this.states[id]);
      if (!mods) continue;
      result.recovery *= mods.recovery ?? 1;
      for (const [category, value] of Object.entries(mods.fatigue ?? {})) result.fatigue[category] = (result.fatigue[category] ?? 1) * value;
    }
    return result;
  }
  context(id) { return { ...this.states[id], stats: { ...this.stats }, modifiers: this.modifiers() }; }
  ranking() {
    return [...this.skills].map(([id, skill]) => {
      const state = this.context(id), hours = state.lastSession === null ? 12 : Math.max(0, (this.time - state.lastSession) / 3600);
      const cost = skill.effortCost(state), effects = skill.sessionEffects?.(state) ?? { energy: -cost, fatigue: cost * .5 };
      const eligible = Number.isFinite(cost) && cost >= 0 && (effects.energy >= 0 || this.stats.energy >= cost + 2);
      const need = clamp(skill.needScore(state, hours), 0, 1);
      return { id, label: skill.label, need, eligible, score: eligible ? need + (id === this.nudge ? 1 : 0) : -1,
        reason: eligible ? (id === this.nudge ? 'Your next-session nudge · ' : '') + (skill.explain?.(state, hours) ?? 'Highest current need') : 'Needs more energy first', cost, effects };
    }).sort((a, b) => b.score - a.score);
  }
  choose() { return this.mode === 'auto' ? this.ranking().find(r => r.eligible)?.id : this.selected; }
  setMode(mode) {
    if (!['auto', 'manual'].includes(mode)) throw new TypeError('Invalid mode');
    this.mode = mode;
    // Switching back explicitly cancels partial autonomous work; spent energy stays spent.
    if (mode === 'manual') this.current = null;
  }
  start(id) {
    if (this.current) return false;
    const entry = this.ranking().find(r => r.id === id);
    if (!entry?.eligible) return false;
    const skill = this.skills.get(id), context = this.context(id);
    const duration = skill.sessionDuration?.(context) ?? skill.duration ?? 1200;
    if (!Number.isFinite(duration) || duration <= 0) throw new RangeError('Invalid session duration');
    this.selected = id;
    this.current = { uid: crypto.randomUUID(), id, elapsed: 0, duration, effects: entry.effects, reason: entry.reason, start: this.time };
    if (id === this.nudge) this.nudge = null;
    return true;
  }
  recordTraining(id, amount = 1) {
    const old = this.states[id], skill = this.skills.get(id);
    if (!skill || !(amount > 0)) return;
    const trained = skill.train({ ...old }, amount);
    const next = { mastery: clamp(trained.mastery), sessions: Math.max(old.sessions, Number.isFinite(trained.sessions) ? trained.sessions : old.sessions), lastSession: this.time };
    this.lastGain = next.mastery - old.mastery; this.states[id] = next;
  }
  advance(seconds) {
    let remaining = clamp(seconds, 0, MAX_CATCHUP * 60);
    while (remaining > 1e-7) {
      if (!this.current) {
        if (this.mode !== 'auto' || !this.start(this.choose())) { this.time += remaining; break; }
      }
      const session = this.current, chunk = Math.min(remaining, session.duration - session.elapsed), fraction = chunk / session.duration;
      this.stats.energy = clamp(this.stats.energy + (session.effects.energy ?? 0) * fraction);
      this.stats.fatigue = clamp(this.stats.fatigue + (session.effects.fatigue ?? 0) * fraction);
      session.elapsed += chunk; this.time += chunk; remaining -= chunk;
      if (session.elapsed >= session.duration - 1e-7) {
        this.recordTraining(session.id); this.completed++;
        this.history.unshift({ uid: session.uid, id: session.id, at: this.time, gain: this.lastGain, reason: session.reason });
        this.history.length = Math.min(24, this.history.length); this.current = null;
      }
    }
  }
  wallTick(now) {
    if (!Number.isFinite(now)) return;
    if (this.lastWall === null) { this.lastWall = now; return; }
    // A backwards clock must not create duplicate time when it catches up.
    if (now <= this.lastWall) return;
    const elapsed = (now - this.lastWall) / 1000; this.lastWall = now;
    if (this.mode !== 'auto' && !this.current) return;
    const seconds = Math.min(MAX_CATCHUP, elapsed), before = this.completed;
    this.advance(seconds * this.speed);
    if (elapsed > 15) this.catchup = { seconds, sessions: this.completed - before, capped: elapsed > MAX_CATCHUP };
  }
  get development() { return development(this.states); }
  serialize() {
    return JSON.stringify({ version: SAVE_VERSION, stats: this.stats, states: this.states, time: this.time, mode: this.mode,
      speed: this.speed, selected: this.selected, current: this.current, history: this.history, completed: this.completed, lastWall: this.lastWall, nudge: this.nudge });
  }
  restore(raw) {
    try {
      const value = JSON.parse(raw);
      if (value.version !== SAVE_VERSION || !Number.isFinite(value.time) || !value.states || !Number.isFinite(value.stats?.energy) || !Number.isFinite(value.stats?.fatigue)) return false;
      this.reset(); this.stats = { energy: clamp(value.stats.energy), fatigue: clamp(value.stats.fatigue) }; this.time = Math.max(0, value.time);
      for (const id of this.skills.keys()) {
        const s = value.states[id]; if (!s) continue;
        this.states[id] = { mastery: clamp(s.mastery), sessions: clamp(s.sessions, 0, 1e9), lastSession: Number.isFinite(s.lastSession) ? clamp(s.lastSession, 0, this.time) : null };
      }
      this.speed = [1,10,60].includes(value.speed) ? value.speed : 1;
      this.mode = value.mode === 'auto' ? 'auto' : 'manual';
      if (this.skills.has(value.selected)) this.selected = value.selected;
      this.completed = clamp(value.completed, 0, 1e9); this.lastWall = Number.isFinite(value.lastWall) ? value.lastWall : null;
      this.nudge = this.skills.has(value.nudge) ? value.nudge : null;
      this.history = Array.isArray(value.history) ? value.history.filter(h => this.skills.has(h.id) && Number.isFinite(h.at) && Number.isFinite(h.gain)).slice(0, 24) : [];
      const c = value.current;
      if (c && this.skills.has(c.id) && Number.isFinite(c.duration) && c.duration > 0 && c.duration <= 86400 && Number.isFinite(c.elapsed) && c.elapsed >= 0 && c.elapsed < c.duration && Number.isFinite(c.effects?.energy) && Number.isFinite(c.effects?.fatigue)) {
        this.current = { uid: typeof c.uid==='string'?c.uid:crypto.randomUUID(), id: c.id, elapsed: c.elapsed, duration: c.duration, effects: { energy: clamp(c.effects.energy, -100, 100), fatigue: clamp(c.effects.fatigue, -100, 100) }, reason: typeof c.reason === 'string' ? c.reason.slice(0, 200) : 'Resumed session', start: this.time - c.elapsed };
      }
      return true;
    } catch { return false; }
  }
}
