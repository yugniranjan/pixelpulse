import { NextResponse } from "next/server";
import {
  hasPostgres,
  listSquadReferrers,
  setSquadReferralStatus,
} from "@/lib/squadReferrals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!hasPostgres()) {
    return NextResponse.json(
      { error: "Postgres is not configured." },
      { status: 503 },
    );
  }

  const referrers = await listSquadReferrers();
  return NextResponse.json({ referrers });
}

export async function PATCH(request) {
  if (!hasPostgres()) {
    return NextResponse.json(
      { error: "Postgres is not configured." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body?.id || "").trim();
  const status = String(body?.status || "").trim();

  if (!id) {
    return NextResponse.json({ error: "Referral id is required." }, { status: 400 });
  }

  const updated = await setSquadReferralStatus(id, status);

  if (!updated) {
    return NextResponse.json(
      { error: "Referral not found or invalid status." },
      { status: 404 },
    );
  }

  return NextResponse.json({ referral: updated });
}
