export type Role = "TURISTA" | "OPERADOR" | "GESTOR" | "ADMIN";

export type AuthSession = {
  token: string;
  email: string;
  fullName: string;
  roles: Role[];
  activeMode: string;
};

export type UserProfile = {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  roles: Role[];
  activeMode: string;
  status: string;
  isVerified: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  fullName: string;
};
