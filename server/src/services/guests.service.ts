import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import { generateQRImage } from "../lib/qrcode";
import { parseGuestExcel, GuestRow } from "../lib/excel";

function admissionsForType(type: string, custom?: number): number {
  if (type === "SINGLE") return 1;
  if (type === "DOUBLE") return 2;
  if (type === "VIP") return 1;
  return custom ?? 1;
}

export async function createGuest(eventId: string, data: {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  guestType?: string;
  maxAdmissions?: number;
  tableNumber?: string;
  seatNumber?: string;
  notes?: string;
}) {
  const guestType = (data.guestType ?? "SINGLE") as "SINGLE" | "DOUBLE" | "FAMILY" | "VIP";
  const maxAdmissions = admissionsForType(guestType, data.maxAdmissions);
  const qrCode = uuidv4();

  const qrImageUrl = await generateQRImage(qrCode, eventId);

  return prisma.guest.create({
    data: {
      eventId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      guestType,
      maxAdmissions,
      tableNumber: data.tableNumber,
      seatNumber: data.seatNumber,
      notes: data.notes,
      qrCode,
      qrImageUrl,
    },
  });
}

export async function listGuests(eventId: string, opts: {
  page?: number;
  pageSize?: number;
  search?: string;
  checkedIn?: boolean;
}) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { eventId };
  if (opts.search) {
    where.OR = [
      { firstName: { contains: opts.search, mode: "insensitive" } },
      { lastName: { contains: opts.search, mode: "insensitive" } },
      { phone: { contains: opts.search } },
    ];
  }
  if (typeof opts.checkedIn === "boolean") where.isCheckedIn = opts.checkedIn;

  const [data, total] = await Promise.all([
    prisma.guest.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { lastName: "asc" },
      include: { _count: { select: { scans: true } } },
    }),
    prisma.guest.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getGuest(id: string) {
  const guest = await prisma.guest.findUnique({
    where: { id },
    include: { scans: { include: { staff: { select: { name: true } } }, orderBy: { createdAt: "desc" } } },
  });
  if (!guest) throw { status: 404, message: "Guest not found" };
  return guest;
}

export async function updateGuest(id: string, data: Partial<{
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  guestType: "SINGLE" | "DOUBLE" | "FAMILY" | "VIP";
  maxAdmissions: number;
  tableNumber: string;
  seatNumber: string;
  notes: string;
}>) {
  return prisma.guest.update({ where: { id }, data: data as Parameters<typeof prisma.guest.update>[0]["data"] });
}

export async function deleteGuest(id: string) {
  await prisma.guest.delete({ where: { id } });
}

export async function regenerateQR(id: string) {
  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) throw { status: 404, message: "Guest not found" };

  const qrCode = uuidv4();
  const qrImageUrl = await generateQRImage(qrCode, guest.eventId);

  return prisma.guest.update({ where: { id }, data: { qrCode, qrImageUrl } });
}

export async function importFromExcel(
  eventId: string,
  buffer: Buffer,
  filename: string,
  importedBy: string
): Promise<{ imported: number; skipped: number; errors: Array<{ row: number; message: string }> }> {
  const { rows, errors } = parseGuestExcel(buffer);

  const BATCH = 100;
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch: GuestRow[] = rows.slice(i, i + BATCH);
    const guests = await Promise.allSettled(
      batch.map((row) => createGuest(eventId, row))
    );
    guests.forEach((r, idx) => {
      if (r.status === "fulfilled") imported++;
      else {
        skipped++;
        errors.push({ row: i + idx + 2, message: String(r.reason?.message ?? "Failed") });
      }
    });
  }

  if (imported > 0) {
    await prisma.importBatch.create({
      data: { eventId, filename, rowCount: imported, importedBy },
    });
  }

  return { imported, skipped, errors };
}
