import * as XLSX from "xlsx";

export interface GuestRow {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  guestType?: string;
  maxAdmissions?: number;
  tableNumber?: string;
  seatNumber?: string;
  notes?: string;
}

export interface ParseResult {
  rows: GuestRow[];
  errors: Array<{ row: number; message: string }>;
}

const VALID_GUEST_TYPES = ["SINGLE", "DOUBLE", "FAMILY", "VIP"];

export function parseGuestExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const rows: GuestRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  raw.forEach((r, idx) => {
    const rowNum = idx + 2; // 1-indexed + header
    const firstName = String(r["firstName"] ?? r["First Name"] ?? r["first_name"] ?? "").trim();
    const lastName = String(r["lastName"] ?? r["Last Name"] ?? r["last_name"] ?? "").trim();

    if (!firstName || !lastName) {
      errors.push({ row: rowNum, message: "firstName and lastName are required" });
      return;
    }

    const rawType = String(r["guestType"] ?? r["Guest Type"] ?? r["guest_type"] ?? "SINGLE")
      .toUpperCase()
      .trim();
    const guestType = VALID_GUEST_TYPES.includes(rawType) ? rawType : "SINGLE";

    const rawMax = r["maxAdmissions"] ?? r["Max Admissions"] ?? r["max_admissions"];
    const maxAdmissions =
      guestType === "SINGLE"
        ? 1
        : guestType === "DOUBLE"
        ? 2
        : rawMax
        ? parseInt(String(rawMax), 10) || 1
        : 1;

    rows.push({
      firstName,
      lastName,
      phone: String(r["phone"] ?? r["Phone"] ?? "").trim() || undefined,
      email: String(r["email"] ?? r["Email"] ?? "").trim() || undefined,
      guestType,
      maxAdmissions,
      tableNumber: String(r["tableNumber"] ?? r["Table Number"] ?? r["table_number"] ?? "").trim() || undefined,
      seatNumber: String(r["seatNumber"] ?? r["Seat Number"] ?? r["seat_number"] ?? "").trim() || undefined,
      notes: String(r["notes"] ?? r["Notes"] ?? "").trim() || undefined,
    });
  });

  return { rows, errors };
}
