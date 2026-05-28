import { getIntegrationStatus } from "@/lib/integrations/status";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(getIntegrationStatus());
}
