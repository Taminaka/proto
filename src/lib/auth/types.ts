export type Role = "TURISTA" | "OPERADOR" | "GESTOR" | "ADMIN";

export type AuthSession = {
  token: string;
  email: string;
  fullName: string;
  roles: Role[];
  activeMode: string;
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
