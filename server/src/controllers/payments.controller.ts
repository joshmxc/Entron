import { Request, Response } from "express";
import * as paymentsService from "../services/payments.service";

export async function initiate(req: Request, res: Response) {
  const data = await paymentsService.initiatePayment({
    ...req.body,
    initiatedBy: req.user?.sub,
  });
  res.json({ success: true, data });
}

export async function mpesaCallback(req: Request, res: Response) {
  await paymentsService.handleMpesaCallback(req.body);
  res.json({ ResultCode: 0, ResultDesc: "Success" });
}

export async function airtelCallback(req: Request, res: Response) {
  await paymentsService.handleAirtelCallback(req.body);
  res.sendStatus(200);
}

export async function list(req: Request, res: Response) {
  const data = await paymentsService.listPayments(
    req.query.eventId as string,
    Number(req.query.page) || 1,
    Number(req.query.pageSize) || 50
  );
  res.json({ success: true, ...data });
}

export async function getOne(req: Request, res: Response) {
  const data = await paymentsService.getPayment(req.params.id);
  if (!data) { res.status(404).json({ success: false, error: "Payment not found" }); return; }
  res.json({ success: true, data });
}
