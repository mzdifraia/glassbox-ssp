import { getIntegrationStatus } from "@/lib/integrations/status";

export async function GET() {
  const integrations = getIntegrationStatus();
  return Response.json({
    ok: true,
    service: "glassbox-ssp",
    integrations,
    timestamp: new Date().toISOString(),
  });
}
