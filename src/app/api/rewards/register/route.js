import { NextResponse } from "next/server";
import {
  createRewardEmailVerification,
  registerRewardMember,
} from "@/lib/rewards";
import { mailerConfigured, sendBrandedEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  try {
    const member = await registerRewardMember({
      fullName: body?.fullName,
      email: body?.email,
      phone: body?.phone,
      age: body?.age,
    });

    let verificationSent = false;

    if (!member.emailVerified && mailerConfigured()) {
      const verification = await createRewardEmailVerification(member.id, member.email);
      if (verification?.code) {
        await sendBrandedEmail({
          to: member.email,
          subject: "Verify your Pixel Pulse Rewards email",
          message: [
            `Hi ${member.fullName || "there"},`,
            "",
            "Welcome to Pixel Pulse Level Up Rewards.",
            "",
            `Your verification code is: ${verification.code}`,
            "",
            "Enter this code on the rewards page to verify your email. This code expires in 30 minutes.",
            "",
            "Pixel Pulse Play Zone",
          ].join("\n"),
        });
        verificationSent = true;
      }
    }

    return NextResponse.json({
      member,
      verificationRequired: !member.emailVerified,
      verificationSent,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to register for rewards." },
      { status: error.status || 500 },
    );
  }
}
