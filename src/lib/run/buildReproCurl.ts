export function buildReproCurl(
  prompt: string,
  opts?: { seed?: string | null; frozen?: boolean }
): string {
  const body: Record<string, unknown> = { prompt };
  if (opts?.seed) body.seed = opts.seed;
  if (opts?.frozen) body.frozen = true;
  const json = JSON.stringify(body);
  return `curl -s -X POST http://localhost:3000/api/run \\
  -H 'Content-Type: application/json' \\
  -d '${json.replace(/'/g, "'\\''")}'`;
}
