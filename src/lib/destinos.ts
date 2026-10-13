/**
 * Fotos locales por destino.
 *
 * Cada carpeta de /public/img/destinos corresponde a un atractivo del
 * catalogo y trae sus propias fotos:
 *
 *   id 1  Parque Nacional Natural Tayrona  ->  parque_tayrona
 *   id 2  Playa El Rodadero                ->  playas_del_rodadero
 *   id 3  Quinta de San Pedro Alejandrino  ->  quinta_de_san_pedro_alejandrino
 *   id 4  Ciudad Perdida                   ->  ciudad_perdida
 *   id 5  Experiencia Minca y cascadas     ->  capital_ecologica_minca
 *
 * La portada de cada tarjeta es la primera foto de su carpeta.
 * El carrusel del detalle usa hasta MAXIMO_FOTOS de la misma carpeta.
 *
 * Si una attraction llega sin carpeta local, la interfaz cae automaticamente
 * en las imagenes que devuelve la API: nada se rompe.
 */

export interface DestinoFotos {
  readonly slug: string;
  readonly portada: string;
  readonly fotos: readonly string[];
}

/** Maximo de fotos del carrusel de detalle, como se solicito. */
export const MAXIMO_FOTOS = 5;

/** Clave id -> slug. El tipo se comprueba aparte: los ids se repiten entre colecciones. */
const SLUG_POR_ID: Record<number, string> = {
  1: "parque_tayrona",
  2: "playas_del_rodadero",
  3: "quinta_de_san_pedro_alejandrino",
  4: "ciudad_perdida",
  5: "capital_ecologica_minca",
};

const TOTAL_POR_SLUG: Record<string, number> = {
  parque_tayrona: 7,
  playas_del_rodadero: 6,
  quinta_de_san_pedro_alejandrino: 5,
  ciudad_perdida: 6,
  capital_ecologica_minca: 4,
};

const cache = new Map<number, DestinoFotos>();

/**
 * Devuelve las fotos locales de un atractivo, o null si no tiene carpeta.
 * @param tipo tipo de coleccion; solo "attractions" tiene fotos propias.
 */
export function getDestinoFotos(tipo: string, id: number): DestinoFotos | null {
  if (tipo !== "attractions") return null;

  const cached = cache.get(id);
  if (cached) return cached;

  const slug = SLUG_POR_ID[id];
  if (!slug) return null;

  const total = TOTAL_POR_SLUG[slug] ?? 0;
  if (total === 0) return null;

  const destino: DestinoFotos = {
    slug,
    portada: `/img/portadas/${slug}.jpg`,
    fotos: Array.from({ length: total }, (_, i) => `/img/destinos/${slug}/${String(i + 1).padStart(2, "0")}.jpg`),
  };

  cache.set(id, destino);
  return destino;
}

/** Portada de la tarjeta, o null si ese atractivo no tiene carpeta propia. */
export function getPortada(tipo: string, id: number): string | null {
  return getDestinoFotos(tipo, id)?.portada ?? null;
}

/** Fotos del carrusel de detalle, limitadas a MAXIMO_FOTOS. */
export function getFotosDetalle(tipo: string, id: number): string[] | null {
  const destino = getDestinoFotos(tipo, id);
  if (!destino) return null;
  return [...destino.fotos].slice(0, MAXIMO_FOTOS);
}
