import { NextResponse } from "next/server";
import {
  checklistTemplate,
  cleanupOldDailyChecklists,
  getDailyChecklist,
  hasDailyChecklistStore,
  listDailyChecklists,
  normalizeChecklistDate,
  saveDailyChecklist,
} from "@/lib/dailyChecklist";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function storeUnavailable() {
  return NextResponse.json(
    { error: "Daily checklist database is not configured." },
    { status: 503 },
  );
}

export async function GET(req) {
  if (!hasDailyChecklistStore()) return storeUnavailable();

  const { searchParams } = new URL(req.url);
  const date = normalizeChecklistDate(searchParams.get("date"));

  try {
    const retention = await cleanupOldDailyChecklists();
    const checklist = await getDailyChecklist(date);
    const recent = await listDailyChecklists({ limit: 10 });
    return NextResponse.json({
      checklist,
      recent,
      retention,
      template: checklistTemplate(),
    });
  } catch (error) {
    console.error("load daily checklist failed:", error);
    return NextResponse.json(
      { error: "Unable to load daily checklist." },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  if (!hasDailyChecklistStore()) return storeUnavailable();

  const body = await req.json().catch(() => ({}));
  try {
    const retention = await cleanupOldDailyChecklists();
    const checklist = await saveDailyChecklist({
      date: body.date,
      items: body.items,
      notes: body.notes,
      completedBy: body.completedBy,
      staffName: body.staffName,
      openingStaff: body.openingStaff,
      closingStaff: body.closingStaff,
      shiftStart: body.shiftStart,
      shiftEnd: body.shiftEnd,
    });
    const recent = await listDailyChecklists({ limit: 10 });

    return NextResponse.json({
      checklist,
      recent,
      retention,
      template: checklistTemplate(),
    });
  } catch (error) {
    console.error("save daily checklist failed:", error);
    return NextResponse.json(
      { error: "Unable to save daily checklist." },
      { status: 500 },
    );
  }
}
