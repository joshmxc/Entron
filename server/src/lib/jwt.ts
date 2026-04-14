import jwt from "jsonwebtoken";
import { config } from "../config";
import { JwtPayload } from "../types";

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: Pick<JwtPayload, "sub">): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, config.jwt.refreshSecret) as { sub: string };
}
