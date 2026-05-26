export interface User {
    id: string;
    name: string;
    phone: string;
    avatar: string | null;
    description: string | null;
    cityId: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
    isBlocked: boolean;
    blockedBy?: string | null;
    blockedReason?: string | null;
    blockedUntil?: string | null;
    createdAt: string;
  }