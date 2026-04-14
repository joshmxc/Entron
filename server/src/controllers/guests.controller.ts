import { Request, Response } from "express";
import * as guestsService from "../services/guests.service";
import fs from "fs";

export async function list(req: Request, res: Response) {
  const data = await guestsService.listGuests(req.params.eventId, {
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 50,
    search: req.query.search as string | undefined,
    checkedIn: req.query.checkedIn === "true" ? true : req.query.checkedIn === "false" ? false : undefined,
  });
  res.json({ success: true, ...data });
}

export async function get(req: Request, res: Response) {
  const data = await guestsService.getGuest(req.params.id);
  res.json({ success: true, data });
}

export async function create(req: Request, res: Response) {
  const data = await guestsService.createGuest(req.params.eventId, req.body);
  res.status(201).json({ success: true, data });
}

export async function update(req: Request, res: Response) {
  const data = await guestsService.updateGuest(req.params.id, req.body);
  res.json({ success: true, data });
}

export async function remove(req: Request, res: Response) {
  await guestsService.deleteGuest(req.params.id);
  res.json({ success: true, message: "Guest deleted" });
}

export async function regenerateQR(req: Request, res: Response) {
  const data = await guestsService.regenerateQR(req.params.id);
  res.json({ success: true, data });
}

export async function importExcel(req: Request, res: Response) {
  if (!req.file) { res.status(400).json({ success: false, error: "No file uploaded" }); return; }
  const buffer = fs.readFileSync(req.file.path);
  const result = await guestsService.importFromExcel(
    req.params.eventId,
    buffer,
    req.file.originalname,
    req.user!.sub
  );
  fs.unlinkSync(req.file.path);
  res.json({ success: true, data: result });
}
