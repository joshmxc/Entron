import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { config } from "../config";
import { verifyAccessToken } from "./jwt";

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.origin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const payload = verifyAccessToken(token);
      (socket as unknown as Record<string, unknown>).user = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as unknown as Record<string, unknown>).user as {
      sub: string;
      role: string;
    };

    socket.on("join:event", (eventId: string) => {
      socket.join(`event:${eventId}`);
    });

    socket.on("join:dashboard", () => {
      if (user.role === "ADMIN") socket.join("dashboard");
    });

    socket.on("join:staff", () => {
      socket.join(`staff:${user.sub}`);
    });

    socket.on("disconnect", () => {
      /* handled by socket.io */
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

export function emitScanResult(eventId: string, data: unknown): void {
  try {
    getIO().to(`event:${eventId}`).emit("scan:new", data);
    getIO().to("dashboard").emit("scan:new", data);
  } catch {
    // socket not yet initialized in tests
  }
}

export function emitPaymentUpdate(eventId: string, data: unknown): void {
  try {
    getIO().to(`event:${eventId}`).emit("payment:update", data);
    getIO().to("dashboard").emit("payment:update", data);
  } catch {
    // ignore
  }
}

export function emitInvitationStatus(guestId: string, data: unknown): void {
  try {
    getIO().to("dashboard").emit("invitation:status", { guestId, ...(data as Record<string, unknown>) });
  } catch {
    // ignore
  }
}
