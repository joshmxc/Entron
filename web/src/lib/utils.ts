import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = "dd MMM yyyy, HH:mm") {
  return format(new Date(date), fmt);
}

export function formatTZS(amount: number | string): string {
  return new Intl.NumberFormat("sw-TZ", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function sanitizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return `255${digits.slice(1)}`;
  return digits;
}
