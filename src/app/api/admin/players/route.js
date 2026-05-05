import { NextResponse } from "next/server";
import { getPostgresPool, query } from "@/lib/postgres";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function serializePlayer(row) {
  return {
    id: row.PlayerID,
    playerId: row.PlayerID,
    firstName: row.FirstName || "",
    lastName: row.LastName || "",
    fullName: [row.FirstName, row.LastName].filter(Boolean).join(" ").trim() || "Unnamed",
    dateOfBirth: row.DateOfBirth ? row.DateOfBirth.toISOString() : "",
    email: row.email || "",
    dateSigned: row.DateSigned ? row.DateSigned.toISOString() : "",
    signeeId: row.SigneeID,
    locationId: row.LocationID,
    locationName: row.locationName || "",
    createdAt: row.createdAt ? row.createdAt.toISOString() : "",
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : "",
  };
}

export async function GET(req) {
  if (!getPostgresPool()) {
    return NextResponse.json(
      { error: "Postgres is not configured." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 500, 1000);
  const locationId = Number(searchParams.get("locationId") || 2);

  const result = await query(
    `
      SELECT
        p."PlayerID",
        p."FirstName",
        p."LastName",
        p."DateOfBirth",
        p.email,
        p."DateSigned",
        p."SigneeID",
        p."LocationID",
        p."createdAt",
        p."updatedAt",
        l."Name" AS "locationName"
      FROM public."Players" p
      LEFT JOIN public."Locations" l ON l."LocationID" = p."LocationID"
      WHERE p."LocationID" = $2
      ORDER BY p."createdAt" DESC NULLS LAST, p."PlayerID" DESC
      LIMIT $1
    `,
    [limit, locationId],
  );

  return NextResponse.json({
    players: result.rows.map(serializePlayer),
  });
}
