import { ActivityCore } from './core.mjs';
import { BenchPressMechanic, skill } from './skills/bench-press.mjs';
// Stable facade for BenchMotion and existing callers.
export class FlyEngine extends BenchPressMechanic {
 constructor(core = new ActivityCore([skill])) { super(core); }
}
