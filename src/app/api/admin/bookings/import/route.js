import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { hasPostgres, bulkImportBookings, existingPartyIds } from "@/lib/bookings";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Look up a value by header name, tolerant of case/spacing/punctuation.
function pick(row, candidates) {
  for (const key of Object.keys(row)) {
    const norm = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (candidates.includes(norm)) return row[key];
  }
  return "";
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// Convert an Excel serial number (or a date string) into { date, time }.
function toDateTime(value) {
  if (value === "" || value == null) return { date: "", time: "" };

  if (typeof value === "number" && Number.isFinite(value)) {
    // Excel 1900 date system: 25569 days between 1899-12-30 and 1970-01-01.
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return { date: "", time: "" };
    // Use UTC parts so the encoded wall-clock value is preserved (no tz drift).
    return {
      date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
      time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    };
  }

  const str = String(value).trim();
  const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (isoMatch) {
    return {
      date: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
      time: isoMatch[4] ? `${pad(isoMatch[4])}:${isoMatch[5]}` : "",
    };
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
      time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
    };
  }
  return { date: "", time: "" };
}

export async function POST(req) {
  if (!hasPostgres()) {
    return NextResponse.json({ error: "Bookings database is not configured." }, { status: 503 });
  }

  let file;
  let dryRun = false;
  try {
    const formData = await req.formData();
    file = formData.get("file");
    dryRun = ["1", "true", "yes"].includes(String(formData.get("dryRun") || "").toLowerCase());
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded file." }, { status: 400 });
  }

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Please choose an .xlsx, .xls, or .csv file." }, { status: 400 });
  }

  let sheetRows;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    sheetRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch (error) {
    console.error("import parse failed:", error);
    return NextResponse.json({ error: "Could not parse that spreadsheet." }, { status: 400 });
  }

  if (!sheetRows.length) {
    return NextResponse.json({ error: "The spreadsheet has no rows." }, { status: 400 });
  }

  const normalized = sheetRows.map((row) => {
    const products = String(pick(row, ["products", "product", "package", "packages"]) || "").trim();
    const { date, time } = toDateTime(pick(row, ["partydate", "date", "datetime", "visitdate"]));
    return {
      customerName: String(pick(row, ["name", "customername", "customer", "fullname"]) || "").trim().replace(/\s+/g, " "),
      email: String(pick(row, ["email", "emailaddress"]) || "").trim(),
      phone: String(pick(row, ["phone", "phonenumber", "mobile"]) || "").trim(),
      partyId: String(pick(row, ["saleid", "partyid", "id", "saleidnumber"]) || "").trim(),
      package: products.split(",")[0].trim(),
      notes: products,
      date,
      time,
    };
  });

  // Preview: classify each row (insert / update / skip) without writing.
  if (dryRun) {
    try {
      const existing = await existingPartyIds(normalized.map((r) => r.partyId));
      const rows = normalized.map((r) => {
        let action = "insert";
        if (!r.customerName || !DATE_RE.test(r.date)) action = "skip";
        else if (r.partyId && existing.has(r.partyId)) action = "update";
        return { ...r, action };
      });
      const counts = {
        insert: rows.filter((r) => r.action === "insert").length,
        update: rows.filter((r) => r.action === "update").length,
        skip: rows.filter((r) => r.action === "skip").length,
      };
      return NextResponse.json({ preview: true, total: rows.length, counts, rows: rows.slice(0, 200) });
    } catch (error) {
      console.error("import preview failed:", error);
      return NextResponse.json({ error: "Could not preview the import." }, { status: 500 });
    }
  }

  try {
    const result = await bulkImportBookings(normalized);
    return NextResponse.json(result);
  } catch (error) {
    console.error("import failed:", error);
    return NextResponse.json({ error: "Import failed while saving bookings." }, { status: 500 });
  }
}
