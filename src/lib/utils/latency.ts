/** Measures wall-clock time between pipeline phases (lap = ms since previous lap). */
export function createPhaseTimer() {
  let last = Date.now();
  return {
    lap(): number {
      const now = Date.now();
      const elapsed = now - last;
      last = now;
      return elapsed;
    },
  };
}

export function createImpressionId(): string {
  return `imp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
