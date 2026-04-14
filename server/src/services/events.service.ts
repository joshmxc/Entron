import { prisma } from "../lib/prisma";

export async function listEvents(activeOnly = false) {
  return prisma.event.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { startDate: "desc" },
    include: { _count: { select: { guests: true, scans: true } } },
  });
}

export async function getEvent(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      _count: { select: { guests: true, scans: true } },
    },
  });
  if (!event) throw { status: 404, message: "Event not found" };
  return event;
}

export async function createEvent(data: {
  name: string;
  nameSwahili?: string;
  description?: string;
  venue: string;
  venueSwahili?: string;
  startDate: string;
  endDate?: string;
  bannerUrl?: string;
}) {
  return prisma.event.create({
    data: {
      name: data.name,
      nameSwahili: data.nameSwahili,
      description: data.description,
      venue: data.venue,
      venueSwahili: data.venueSwahili,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      bannerUrl: data.bannerUrl,
    },
  });
}

export async function updateEvent(id: string, data: Partial<{
  name: string;
  nameSwahili: string;
  description: string;
  venue: string;
  venueSwahili: string;
  startDate: string;
  endDate: string;
  bannerUrl: string;
  isActive: boolean;
}>) {
  const update: Record<string, unknown> = { ...data };
  if (data.startDate) update.startDate = new Date(data.startDate);
  if (data.endDate) update.endDate = new Date(data.endDate);
  return prisma.event.update({ where: { id }, data: update });
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } });
}

export async function getEventStats(eventId: string) {
  const [totalGuests, checkedIn, scans, staffScans] = await Promise.all([
    prisma.guest.count({ where: { eventId } }),
    prisma.guest.count({ where: { eventId, isCheckedIn: true } }),
    prisma.scan.groupBy({
      by: ["status"],
      where: { eventId },
      _count: true,
    }),
    prisma.scan.groupBy({
      by: ["staffId"],
      where: { eventId },
      _count: true,
      orderBy: { _count: { staffId: "desc" } },
    }),
  ]);

  const scanMap: Record<string, number> = {};
  scans.forEach((s: { status: string; _count: number }) => { scanMap[s.status] = s._count; });

  return {
    totalGuests,
    checkedIn,
    notCheckedIn: totalGuests - checkedIn,
    attendance: totalGuests > 0 ? Math.round((checkedIn / totalGuests) * 100) : 0,
    scans: {
      total: Object.values(scanMap).reduce((a, b) => a + b, 0),
      ...scanMap,
    },
    topStaff: staffScans.slice(0, 5),
  };
}
