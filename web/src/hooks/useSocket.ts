"use client";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";

let socket: Socket | null = null;

function getSocketUrl(): string {
  if (typeof window === "undefined") return "http://localhost:4000";
  // Use same hostname as browser but port 4000 — works from both PC and phone
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

export function useSocket() {
  const { accessToken } = useAuthStore();
  const ref = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    if (!socket) {
      socket = io(getSocketUrl(), {
        auth: { token: accessToken },
        transports: ["websocket"],
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });
    }

    ref.current = socket;
  }, [accessToken]);

  return ref.current;
}

export function getSocket(): Socket | null {
  return socket;
}

export function joinEventRoom(eventId: string) {
  socket?.emit("join:event", eventId);
}

export function joinDashboard() {
  socket?.emit("join:dashboard");
}

export function joinStaffRoom() {
  socket?.emit("join:staff");
}
