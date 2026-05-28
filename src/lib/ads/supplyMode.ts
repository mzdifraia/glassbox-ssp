/** How stub inventory is built before auction jitter in runPipeline. */
export function useRandomSupply(): boolean {
  if (process.env.ENABLE_THRAD_GTM === "1" && process.env.THRAD_API_KEY?.trim()) {
    return false;
  }
  if (process.env.RANDOM_SUPPLY === "0") return false;
  if (process.env.RANDOM_SUPPLY === "1") return true;
  // Default on Vercel deploys — each request synthesizes new candidates
  return process.env.VERCEL === "1";
}

export function supplyInventoryLabel(): "random" | "catalog" {
  return useRandomSupply() ? "random" : "catalog";
}
