import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export async function login(req: Request, res: Response) {
  const { phone, password } = req.body;
  const result = await authService.login(phone, password);
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth/refresh",
  });
  res.json({ success: true, data: { accessToken: result.accessToken, user: result.user } });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
  if (!token) { res.status(401).json({ success: false, error: "No refresh token" }); return; }
  const result = await authService.refresh(token);
  res.json({ success: true, data: result });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
  if (token) await authService.logout(token);
  res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });
  res.json({ success: true, message: "Logged out" });
}

export async function me(req: Request, res: Response) {
  res.json({ success: true, data: req.user });
}
