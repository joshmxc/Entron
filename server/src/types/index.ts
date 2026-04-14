export interface JwtPayload {
  sub: string;
  role: "ADMIN" | "STAFF";
  name: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ScanPayload {
  qrCode: string;
  eventId: string;
  deviceInfo?: string;
  offlineTimestamp?: string;
}

export interface ScanResult {
  status: string;
  guest?: {
    id: string;
    firstName: string;
    lastName: string;
    guestType: string;
    maxAdmissions: number;
    admissionsUsed: number;
    tableNumber?: string | null;
  };
  admissionCount?: number;
  message: string;
}
