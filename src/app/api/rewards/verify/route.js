import { NextResponse } from "next/server";
import { verifyRewardMemberEmail } from "@/lib/rewards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  try {
    const member = await verifyRewardMemberEmail({
      email: body?.email,
      code: body?.code,
    });

    return NextResponse.json({ member });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to verify this email." },
      { status: error.status || 500 },
    );
  }
}
