"use client";

import { useEffect, useState } from "react";

/**
 * Deslizador automatico del panel "Destino Santa Marta".
 * Cambia de foto cada 3 segundos y se detiene si el usuario pasa el cursor
 * o si la pestana pierde el foco.
 *
 * Si una foto no existe o falla al cargar, se muestra el degradado Caribe
 * de fondo para que el panel nunca quede en blanco.
 */

/**
 * Fotos del carrusel principal "Destino Santa Marta".
 * Son 8 y rotan cada 3 segundos. Al cambiar los archivos, cambiar esta lista.
 */
export const FOTOS_HERO = [
  "/img/hero/santa-marta-01.jpg",
  "/img/hero/santa-marta-02.jpg",
  "/img/hero/santa-marta-03.jpg",
  "/img/hero/santa-marta-04.jpg",
  "/img/hero/santa-marta-05.jpg",
  "/img/hero/santa-marta-06.jpg",
  "/img/hero/santa-marta-07.jpg",
  "/img/hero/santa-marta-08.jpg",
];

const INTERVALO_MS = 3000;

export function HeroCarousel({ fotos = FOTOS_HERO }: { fotos?: string[] }) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [fallidas, setFallidas] = useState<string[]>([]);

  const total = fotos.length;

  useEffect(() => {
    if (pausado || total < 2) return;
    const t = setInterval(() => {
      setIndice((i) => (i + 1) % total);
    }, INTERVALO_MS);
    return () => clearInterval(t);
  }, [pausado, total]);

  // Pausa cuando la pestana no esta visible: no tiene sentido rotar en segundo plano.
  useEffect(() => {
    const alCambiarVisibilidad = () => setPausado(document.hidden);
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => document.removeEventListener("visibilitychange", alCambiarVisibilidad);
  }, []);

  const validas = fotos.filter((f) => !fallidas.includes(f));
  const posicionActual = validas.length ? indice % validas.length : 0;

  return (
    <div
      className="hero-art"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* El marco inclinado es ahora la ventana por la que se ven las fotos.
          El degradado de fondo de .hero-art se mantiene intacto. */}
      <div className="hero-art__frame">
        <div className="hero-carousel">
          {validas.map((foto, i) => (
            <img
              key={foto}
              className={`hero-carousel__slide${i === posicionActual ? " activa" : ""}`}
              src={foto}
              alt={
                i === posicionActual
                  ? `Santa Marta, vista ${posicionActual + 1} de ${validas.length}`
                  : ""
              }
              loading={i === 0 ? "eager" : "lazy"}
              aria-hidden={i !== posicionActual}
              onError={() => setFallidas((prev) => [...prev, foto])}
            />
          ))}
        </div>

        {validas.length > 1 ? (
          <div className="hero-carousel__dots" role="tablist" aria-label="Fotos del destino">
            {validas.map((foto, i) => (
              <button
                key={foto}
                type="button"
                role="tab"
                aria-selected={i === posicionActual}
                aria-label={`Foto ${i + 1} de ${validas.length}`}
                className={`hero-carousel__dot${i === posicionActual ? " activo" : ""}`}
                onClick={() => setIndice(i)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="art-label">
        DESTINO
        <br />
        <strong>SANTA MARTA</strong>
      </div>
    </div>
  );
}
