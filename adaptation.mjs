export const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

// Game curve: practice approaches a positive cost floor, never free work.
export function adaptedCost(base, mastery, floor = .25, k = .045) {
  if (!(base >= 0 && floor > 0 && floor <= 1 && k > 0)) throw new RangeError('Invalid adaptation parameters');
  return base * (floor + (1 - floor) * Math.exp(-k * Math.max(0, mastery || 0)));
}

export function development(states) {
  const values = Object.values(states).filter(s => s.sessions > 0);
  const total = values.reduce((n, s) => n + s.mastery, 0);
  return { total, practiced: values.length, growth: 1 - Math.exp(-total / 160) };
}
