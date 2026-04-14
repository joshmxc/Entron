import { Request, Response } from "express";
import * as eventsService from "../services/events.service";

export async function list(req: Request, res: Response) {
  const activeOnly = req.query.active === "true";
  const data = await eventsService.listEvents(activeOnly);
  res.json({ success: true, data });
}

export async function get(req: Request, res: Response) {
  const data = await eventsService.getEvent(req.params.id);
  res.json({ success: true, data });
}

export async function create(req: Request, res: Response) {
  const data = await eventsService.createEvent(req.body);
  res.status(201).json({ success: true, data });
}

export async function update(req: Request, res: Response) {
  const data = await eventsService.updateEvent(req.params.id, req.body);
  res.json({ success: true, data });
}

export async function remove(req: Request, res: Response) {
  await eventsService.deleteEvent(req.params.id);
  res.json({ success: true, message: "Event deleted" });
}

export async function stats(req: Request, res: Response) {
  const data = await eventsService.getEventStats(req.params.id);
  res.json({ success: true, data });
}
