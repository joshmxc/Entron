import { prisma } from "../lib/prisma";
import { sendTextMessage } from "../lib/whatsapp";
import { sendBulkSMS, getSMSBalance } from "../lib/sms";

const WHATSAPP_DELAY = 60; // ms between WhatsApp messages
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function personalize(template: string, firstName: string, lastName: string) {
  return template
    .replace(/\{\{name\}\}/g, `${firstName} ${lastName}`)
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{lastName\}\}/g, lastName);
}

export async function sendBulkMessages(opts: {
  eventId: string;
  guestIds: string[];
  message: string;
  channel: "WHATSAPP" | "SMS" | "BOTH";
  sentBy: string;
}) {
  const { guestIds, message, channel, sentBy } = opts;
  const results = {
    sent: 0,
    failed: 0,
    details: [] as { name: string; phone: string; status: string; channel: string }[],
  };

  // Load all guests in one query
  const guests = await prisma.guest.findMany({
    where: { id: { in: guestIds } },
    select: { id: true, firstName: true, lastName: true, phone: true },
  });

  const withPhone = guests.filter((g) => g.phone);
  const noPhone   = guests.filter((g) => !g.phone);

  // Record failures for guests without phone
  noPhone.forEach((g) => {
    results.failed++;
    results.details.push({ name: `${g.firstName} ${g.lastName}`, phone: "—", status: "Hakuna nambari", channel });
  });

  // ── SMS: send as one bulk request ──────────────────────────────────────
  if ((channel === "SMS" || channel === "BOTH") && withPhone.length > 0) {
    try {
      const smsMessages = withPhone.map((g) => ({
        to: g.phone!,
        text: personalize(message, g.firstName, g.lastName),
      }));

      const reference = `entron_${Date.now()}`;
      const bulkResult = await sendBulkSMS(smsMessages, reference);

      // Save to DB and tally results
      for (let i = 0; i < withPhone.length; i++) {
        const guest = withPhone[i];
        const apiResult = bulkResult.results[i];
        const body = smsMessages[i].text;
        const succeeded = apiResult && !apiResult.status.includes("FAILED");

        await prisma.outboundMessage.create({
          data: {
            sentBy,
            phone: guest.phone!,
            body,
            channel: "SMS",
            externalId: apiResult?.messageId ?? null,
            status: succeeded ? "SENT" : "FAILED",
          },
        });

        if (succeeded) {
          results.sent++;
          results.details.push({ name: `${guest.firstName} ${guest.lastName}`, phone: guest.phone!, status: "Imetumwa", channel: "SMS" });
        } else {
          results.failed++;
          results.details.push({ name: `${guest.firstName} ${guest.lastName}`, phone: guest.phone!, status: "Imeshindwa", channel: "SMS" });
        }
      }
    } catch (err) {
      // Whole batch failed
      for (const guest of withPhone) {
        await prisma.outboundMessage.create({
          data: { sentBy, phone: guest.phone!, body: personalize(message, guest.firstName, guest.lastName), channel: "SMS", status: "FAILED" },
        });
        results.failed++;
        results.details.push({ name: `${guest.firstName} ${guest.lastName}`, phone: guest.phone!, status: "Imeshindwa", channel: "SMS" });
      }
    }
  }

  // ── WhatsApp: send individually (API limitation) ───────────────────────
  if (channel === "WHATSAPP" || channel === "BOTH") {
    for (const guest of withPhone) {
      await sleep(WHATSAPP_DELAY);
      const body = personalize(message, guest.firstName, guest.lastName);
      try {
        const externalId = await sendTextMessage({ to: guest.phone!, body });
        await prisma.outboundMessage.create({
          data: { sentBy, phone: guest.phone!, body, channel: "WHATSAPP", externalId, status: "SENT" },
        });
        results.sent++;
        results.details.push({ name: `${guest.firstName} ${guest.lastName}`, phone: guest.phone!, status: "Imetumwa", channel: "WHATSAPP" });
      } catch {
        await prisma.outboundMessage.create({
          data: { sentBy, phone: guest.phone!, body, channel: "WHATSAPP", status: "FAILED" },
        });
        results.failed++;
        results.details.push({ name: `${guest.firstName} ${guest.lastName}`, phone: guest.phone!, status: "Imeshindwa", channel: "WHATSAPP" });
      }
    }
  }

  return results;
}

export async function listMessages(eventId: string, page = 1, pageSize = 50) {
  const guests = await prisma.guest.findMany({ where: { eventId }, select: { phone: true } });
  const phones = guests.map((g) => g.phone).filter(Boolean) as string[];
  const where = { phone: { in: phones } };

  const [data, total] = await Promise.all([
    prisma.outboundMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { sender: { select: { name: true } } },
    }),
    prisma.outboundMessage.count({ where }),
  ]);
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getEventGuests(eventId: string) {
  return prisma.guest.findMany({
    where: { eventId },
    select: { id: true, firstName: true, lastName: true, phone: true, guestType: true },
    orderBy: { lastName: "asc" },
  });
}

export { getSMSBalance };
