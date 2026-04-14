import { prisma } from "../lib/prisma";
import { emitScanResult } from "../lib/socket";
import { ScanPayload, ScanResult } from "../types";

export async function processScan(
  payload: ScanPayload,
  staffId: string,
  deviceInfo?: string
): Promise<ScanResult> {
  const guest = await prisma.guest.findUnique({
    where: { qrCode: payload.qrCode },
  });

  if (!guest) {
    const result: ScanResult = { status: "INVALID_QR", message: "QR code not found" };
    emitScanResult(payload.eventId, { status: "INVALID_QR", eventId: payload.eventId, staffId });
    return result;
  }

  if (guest.eventId !== payload.eventId) {
    const result: ScanResult = { status: "WRONG_EVENT", message: "QR code belongs to a different event" };
    emitScanResult(payload.eventId, { status: "WRONG_EVENT", guestId: guest.id, eventId: payload.eventId, staffId });
    return result;
  }

  if (guest.admissionsUsed >= guest.maxAdmissions) {
    const result: ScanResult = {
      status: "LIMIT_REACHED",
      guest: {
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        guestType: guest.guestType,
        maxAdmissions: guest.maxAdmissions,
        admissionsUsed: guest.admissionsUsed,
        tableNumber: guest.tableNumber,
      },
      message: `Entry limit reached (${guest.admissionsUsed}/${guest.maxAdmissions})`,
    };
    await prisma.scan.create({
      data: {
        guestId: guest.id,
        eventId: payload.eventId,
        staffId,
        status: "LIMIT_REACHED",
        admissionCount: 0,
        deviceInfo,
      },
    });
    emitScanResult(payload.eventId, { status: "LIMIT_REACHED", guestId: guest.id, eventId: payload.eventId, staffId });
    return result;
  }

  const newUsed = guest.admissionsUsed + 1;
  const [updatedGuest, scan] = await prisma.$transaction([
    prisma.guest.update({
      where: { id: guest.id },
      data: {
        admissionsUsed: newUsed,
        isCheckedIn: true,
        checkedInAt: guest.checkedInAt ?? new Date(),
      },
    }),
    prisma.scan.create({
      data: {
        guestId: guest.id,
        eventId: payload.eventId,
        staffId,
        status: "SUCCESS",
        admissionCount: 1,
        deviceInfo,
        syncedFromOffline: !!payload.offlineTimestamp,
        originalTimestamp: payload.offlineTimestamp ? new Date(payload.offlineTimestamp) : undefined,
      },
    }),
  ]);

  const result: ScanResult = {
    status: "SUCCESS",
    guest: {
      id: guest.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      guestType: guest.guestType,
      maxAdmissions: guest.maxAdmissions,
      admissionsUsed: newUsed,
      tableNumber: guest.tableNumber,
    },
    admissionCount: 1,
    message: `Welcome, ${guest.firstName} ${guest.lastName}!`,
  };

  emitScanResult(payload.eventId, {
    ...result,
    scanId: scan.id,
    staffId,
    eventId: payload.eventId,
    timestamp: scan.createdAt,
  });

  return result;
}

export async function batchSync(
  items: ScanPayload[],
  staffId: string
): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;
  for (const item of items) {
    try {
      await processScan(item, staffId);
      synced++;
    } catch {
      errors++;
    }
  }
  return { synced, errors };
}

export async function getScans(eventId: string, staffId?: string, page = 1, pageSize = 50) {
  const where: Record<string, unknown> = { eventId };
  if (staffId) where.staffId = staffId;

  const [data, total] = await Promise.all([
    prisma.scan.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        guest: { select: { firstName: true, lastName: true, guestType: true } },
        staff: { select: { name: true } },
      },
    }),
    prisma.scan.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getStaffStats(staffId: string, eventId?: string) {
  const where: Record<string, unknown> = { staffId };
  if (eventId) where.eventId = eventId;

  const [total, byStatus, recentScans] = await Promise.all([
    prisma.scan.count({ where }),
    prisma.scan.groupBy({ by: ["status"], where, _count: true }),
    prisma.scan.findMany({
      where,
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        guest: { select: { firstName: true, lastName: true, guestType: true } },
      },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  byStatus.forEach((s: { status: string; _count: number }) => { statusMap[s.status] = s._count; });

  return { total, ...statusMap, recentScans };
}
