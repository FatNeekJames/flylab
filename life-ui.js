import { SIM_RATE } from './core.mjs';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'flylab-life-v1';
export class LifeController {
  constructor(core, engine, motion) {
    this.core = core; this.engine = engine; this.motion = motion; this.owner = true; this.savedAt = 0;
    try { core.restore(localStorage.getItem(SAVE_KEY)); } catch { /* private browsing: still playable */ }
    this.catchUp();
    this.cards = new Map();
    for (const [id, skill] of core.skills) {
      const card = document.createElement('article'); card.className = 'skill-card';
      card.innerHTML = '<div><span class="skill-category"></span><b></b></div><button type="button">Nudge next</button><p></p><progress max="100" value="0"></progress><small></small>';
      card.querySelector('b').textContent = skill.label;
      card.querySelector('.skill-category').textContent = skill.category;
      const button = card.querySelector('button'); button.setAttribute('aria-label', `Choose ${skill.label}`);
      button.onclick = () => {
        if (!this.owner) return;
        core.selected = id;
        if (core.mode === 'auto') core.nudge = id;
        this.render(); this.save();
      };
      $('skillGrid').appendChild(card); this.cards.set(id, card);
    }
    $('autoMode').onclick = () => this.setMode('auto');
    $('manualMode').onclick = () => this.setMode('manual');
    $('runSession').onclick = () => {
      if (!this.owner || core.mode !== 'manual' || core.current) return;
      this.engine.running = false; this.engine.pushing = false; this.motion.reset();
      if (core.start(core.selected)) core.lastWall = Date.now();
      this.render(); this.save();
    };
    $('cancelSession').onclick = () => { if (this.owner) { core.current = null; this.render(); this.save(); } };
    $('clearNudge').onclick = () => { core.nudge = null; this.render(); };
    // The timer, rather than the WebGL render loop, owns lifecycle time.
    this.timer = setInterval(() => { this.catchUp(); this.render(); if (Date.now() - this.savedAt > 5000) this.save(); }, 250);
    document.addEventListener('visibilitychange', () => { this.catchUp(); this.save(); });
    window.addEventListener('pagehide', () => this.save());
    // One writer per origin where Web Locks is available. Other tabs remain read-only.
    if (navigator.locks) {
      this.owner = false;
      navigator.locks.request('flylab-life-writer', { ifAvailable: true }, async lock => {
        if (!lock) { this.render(); return; }
        this.owner = true;
        try { core.restore(localStorage.getItem(SAVE_KEY)); } catch {}
        this.catchUp(); this.render();
        await new Promise(resolve => { this.release = resolve; });
      });
      window.addEventListener('pagehide', () => this.release?.());
      window.addEventListener('storage', event => {
        if (!this.owner && event.key === SAVE_KEY && event.newValue) { core.restore(event.newValue); this.render(); }
      });
    }
    this.render();
  }
  get active() { return this.core.mode === 'auto' || !!this.core.current; }
  get skill() { return this.core.skills.get(this.core.current?.id); }
  catchUp() { if (this.owner) this.core.wallTick(Date.now()); }
  setMode(mode) {
    if (!this.owner) return;
    this.catchUp(); this.engine.running = false; this.engine.pushing = false; this.motion.reset();
    this.core.setMode(mode); this.core.lastWall = Date.now();
    if (mode === 'auto') this.core.advance(.001);
    this.render(); this.save();
  }
  save() {
    if (!this.owner) return;
    try { localStorage.setItem(SAVE_KEY, this.core.serialize()); this.savedAt = Date.now(); $('saveStatus').textContent = 'Saved on this device'; }
    catch { $('saveStatus').textContent = 'Storage unavailable · progress lasts this visit'; }
  }
  reset() { this.core.reset(); this.core.lastWall = Date.now(); this.motion.reset(); this.render(); this.save(); }
  neuralSignal() {
    const skill = this.skill, session = this.core.current;
    if (!skill || !session) return null;
    const state = this.core.states[skill.id], effort = Math.min(1, skill.effortCost(this.core.context(skill.id)) / Math.max(1, skill.baseCost ?? 15));
    return { label: skill.label, motor: (skill.signals.motor ?? 0) * effort,
      learning: Math.min(1, .2 + skill.gain * .22) * (1 - state.mastery / 100), decision: (skill.signals.decision ?? 0) * effort };
  }
  render() {
    const c = this.core, skill = this.skill, s = c.current, auto = c.mode === 'auto';
    for (const [id, enabled] of [['autoMode', auto], ['manualMode', !auto]]) { $(id).classList.toggle('selected', enabled); $(id).setAttribute('aria-pressed', enabled); $(id).disabled = !this.owner; }
    $('lifeCurrent').textContent = skill?.label ?? (auto ? 'Choosing next activity…' : 'Your fly. Your pace.');
    $('lifeReason').textContent = s?.reason ?? (auto ? 'Needs are evaluated at each session boundary.' : 'Bench controls work as before. Choose another skill for a single session, or switch on autonomy.');
    $('sessionProgress').value = s ? s.elapsed / s.duration : 0;
    $('sessionTime').textContent = s ? `${Math.ceil((s.duration - s.elapsed) / 60)} simulated min remaining` : 'No activity session running';
    $('simClock').textContent = `Day ${Math.floor(c.time / 86400) + 1} · ${String(Math.floor(c.time / 3600) % 24).padStart(2, '0')}:${String(Math.floor(c.time / 60) % 60).padStart(2, '0')}`;
    $('lifeEnergy').textContent = `${Math.round(c.stats.energy)}%`;
    $('lifeFatigue').textContent = `${Math.round(c.stats.fatigue)}%`;
    $('lifeSessions').textContent = c.completed;
    $('growthValue').textContent = `${Math.round(c.development.growth * 100)}%`;
    $('growthText').textContent = `${c.development.practiced} skills practiced · ${c.development.total.toFixed(1)} combined mastery`;
    const selected = c.skills.get(c.selected);
    $('runSession').textContent = `Run ${selected?.label ?? 'activity'} session`;
    $('runSession').disabled = !this.owner || auto || !!s || !c.ranking().find(r => r.id === c.selected)?.eligible;
    $('cancelSession').hidden = auto || !s; $('cancelSession').disabled = !this.owner;
    $('nudgeStatus').textContent = c.nudge ? `Next nudge: ${c.skills.get(c.nudge).label}` : 'No nudge queued';
    $('clearNudge').disabled = !c.nudge || !this.owner;
    $('tabStatus').hidden = this.owner;
    for (const item of c.ranking()) {
      const card = this.cards.get(item.id); if (!card) continue;
      const state = c.states[item.id];
      card.classList.toggle('current', item.id === s?.id); card.classList.toggle('chosen', item.id === c.selected);
      card.querySelector('button').textContent = auto ? (c.nudge === item.id ? 'Queued' : 'Nudge next') : (c.selected === item.id ? 'Selected' : 'Select');
      card.querySelector('button').disabled = !this.owner;
      card.querySelector('p').textContent = `Need ${Math.round(item.need * 100)}% · ${item.cost.toFixed(1)} energy/session`;
      card.querySelector('progress').value = state.mastery;
      card.querySelector('small').textContent = `${state.mastery.toFixed(1)}% mastery · ${state.sessions.toFixed(1)} sessions${item.eligible ? '' : ' · Recover first'}`;
    }
    $('sessionHistory').replaceChildren(...c.history.slice(0, 6).map(item => {
      const li = document.createElement('li'); li.textContent = `${c.skills.get(item.id).label} · +${item.gain.toFixed(2)} mastery · day ${Math.floor(item.at / 86400) + 1}`; return li;
    }));
    if (!c.history.length) { const li = document.createElement('li'); li.textContent = 'Your training history starts here.'; $('sessionHistory').appendChild(li); }
    const mods = c.modifiers(); $('supportEffects').textContent = `Yoga: ${Math.round((1 - (mods.fatigue.physical ?? 1)) * 100)}% less physical fatigue · Cooking: ${Math.round((mods.recovery - 1) * 100)}% faster recovery`;
    $('catchupNotice').hidden = !c.catchup;
    if (c.catchup) $('catchupNotice').textContent = `Caught up ${Math.round(c.catchup.seconds / 60)} real minutes: ${c.catchup.sessions} sessions.${c.catchup.capped ? ' Catch-up limited to the first 24 hours away.' : ''}`;
    document.querySelectorAll('.loadpanel button,.loadpanel input').forEach(input => { input.disabled = this.active || !this.owner; });
  }
}
