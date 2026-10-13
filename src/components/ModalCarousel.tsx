'use client';

import { useState } from 'react';
import { getFotosDetalle } from '@/lib/destinos';

/**
 * Deslizador del modal de detalle.
 *
 * Cada atractivo tiene su propia carpeta de fotos en /public/img/destinos, asi
 * que el carrusel muestra hasta MAXIMO_FOTOS de SU carpeta. Si el atractivo no
 * tiene carpeta local, cae automaticamente a las imagenes que devuelve la API.
 *
 * Navegacion manual con flechas: en un modal, rotar solo molesta.
 */

const MAXIMO = 5;

export function ModalCarousel({
  imagenes,
  nombre,
  tipo,
  id,
}: {
  imagenes?: string[] | null;
  nombre: string;
  tipo: string;
  id: number;
}) {
  const [indice, setIndice] = useState(0);
  const [fallidas, setFallidas] = useState<string[]>([]);

  const deApi = (imagenes ?? []).filter((f) => typeof f === 'string' && f.trim() !== '');
  const propias = getFotosDetalle(tipo, id);
  const galeria = propias && propias.length > 0 ? propias : deApi;
  const fotos = galeria.filter((f) => !fallidas.includes(f)).slice(0, MAXIMO);

  if (fotos.length === 0) {
    return <div className="modal-image">{nombre.slice(0, 1)}</div>;
  }

  const actual = indice % fotos.length;
  const ir = (delta: number) => setIndice((i) => (i + delta + fotos.length) % fotos.length);

  return (
    <div className="modal-carousel">
      <img
        className="modal-carousel__img"
        src={fotos[actual]}
        alt={`${nombre} — foto ${actual + 1} de ${fotos.length}`}
        onError={() => {
          setFallidas((prev) => [...prev, fotos[actual]]);
          setIndice(0);
        }}
      />

      {fotos.length > 1 ? (
        <>
          <button
            type="button"
            className="modal-carousel__arrow modal-carousel__arrow--prev"
            onClick={() => ir(-1)}
            aria-label="Foto anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="modal-carousel__arrow modal-carousel__arrow--next"
            onClick={() => ir(1)}
            aria-label="Foto siguiente"
          >
            ›
          </button>

          <div className="modal-carousel__dots" aria-label="Posición de la foto">
            {fotos.map((foto, i) => (
              <span
                key={foto}
                className={`modal-carousel__dot${i === actual ? " activo" : ""}`}
                aria-hidden="true"
              />
            ))}
          </div>

          <span className="modal-carousel__counter">
            {actual + 1} / {fotos.length}
          </span>
        </>
      ) : null}
    </div>
  );
}
