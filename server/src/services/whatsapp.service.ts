import { prisma } from "../lib/prisma";
import { sendTextMessage, sendImageMessage } from "../lib/whatsapp";
import { emitInvitationStatus } from "../lib/socket";

const RATE_DELAY_MS = 50; // 20 msgs/sec

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendBulk(
  guestIds: string[],
  message: string,
  sentBy: string,
  includeCard = true
) {
  const results = { sent: 0, failed: 0 };

  for (const guestId of guestIds) {
    await sleep(RATE_DELAY_MS);

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: { invitations: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!guest?.phone) {
      results.failed++;
      continue;
    }

    const personalizedMsg = message
      .replace("{{name}}", `${guest.firstName} ${guest.lastName}`)
      .replace("{{firstName}}", guest.firstName)
      .replace("{{lastName}}", guest.lastName);

    try {
      let messageId: string;
      const invitation = guest.invitations[0];

      if (includeCard && invitation?.cardUrl) {
        const cardPublicUrl = `${process.env.SERVER_ORIGIN ?? "http://localhost:4000"}${invitation.cardUrl}`;
        messageId = await sendImageMessage(guest.phone, cardPublicUrl, personalizedMsg);
      } else {
        messageId = await sendTextMessage({ to: guest.phone, body: personalizedMsg });
      }

      if (invitation) {
        await prisma.guestInvitation.update({
          where: { id: invitation.id },
          data: { status: "SENT", sentAt: new Date(), messageId },
        });
        emitInvitationStatus(guestId, { status: "SENT", messageId });
      }

      await prisma.outboundMessage.create({
        data: { sentBy, phone: guest.phone, body: personalizedMsg, externalId: messageId, status: "SENT" },
      });

      results.sent++;
    } catch {
      results.failed++;
      if (guest.invitations[0]) {
        await prisma.guestInvitation.update({
          where: { id: guest.invitations[0].id },
          data: { status: "FAILED", errorMessage: "Send failed" },
        });
      }
    }
  }

  return results;
}
