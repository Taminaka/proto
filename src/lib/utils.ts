/**
 * Utilidad minima equivalente a la de shadcn, sin dependencias.
 * Shadcn usa clsx + tailwind-merge; aqui no hay Tailwind, asi que solo hace falta
 * unir clases descartando vacias y falsos.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  const walk = (value: ClassValue): void => {
    if (!value && value !== 0) return;
    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value === "object") {
      for (const [key, activo] of Object.entries(value)) {
        if (activo) out.push(key);
      }
    }
  };

  inputs.forEach(walk);
  return out.join(" ");
}
