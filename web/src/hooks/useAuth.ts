"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function useAuth(requireRole?: "ADMIN" | "STAFF") {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || !accessToken) {
      router.push("/login");
      return;
    }
    if (requireRole === "ADMIN" && user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, accessToken, requireRole, router]);

  return { user, isAdmin: user?.role === "ADMIN" };
}
