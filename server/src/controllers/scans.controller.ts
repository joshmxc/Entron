import { Request, Response } from "express";
import * as scansService from "../services/scans.service";

export async function scan(req: Request, res: Response) {
  const result = await scansService.processScan(
    { qrCode: req.body.qrCode, eventId: req.body.eventId, offlineTimestamp: req.body.offlineTimestamp },
    req.user!.sub,
    req.headers["user-agent"]
  );
  res.json({ success: true, data: result });
}

export async function batchSync(req: Request, res: Response) {
  const { items } = req.body as { items: Array<{ qrCode: string; eventId: string; offlineTimestamp?: string }> };
  const result = await scansService.batchSync(items, req.user!.sub);
  res.json({ success: true, data: result });
}

export async function list(req: Request, res: Response) {
  const staffId = req.user!.role === "STAFF" ? req.user!.sub : (req.query.staffId as string | undefined);
  const data = await scansService.getScans(
    req.query.eventId as string,
    staffId,
    Number(req.query.page) || 1,
    Number(req.query.pageSize) || 50
  );
  res.json({ success: true, ...data });
}

export async function staffStats(req: Request, res: Response) {
  const staffId = req.user!.role === "STAFF" ? req.user!.sub : (req.params.staffId ?? req.user!.sub);
  const data = await scansService.getStaffStats(staffId, req.query.eventId as string | undefined);
  res.json({ success: true, data });
}
