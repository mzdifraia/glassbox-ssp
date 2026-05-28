export function mockLatency(): number {
  return 40 + Math.floor(Math.random() * 60);
}

export function createImpressionId(): string {
  return `imp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
