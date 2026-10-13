# Informe de pruebas — Prototipo Tamaka

**Fecha:** 12 de octubre de 2026
**Frontend:** `C:\Users\jejim\Videos\front-Taminaka-proto-main`
**Producción (referencia):** <https://proto.taminaka.com>
**API probada:** `https://proto-api.taminaka.com/api`

> Todo se probó **sin ejecutar una sola escritura** (POST/PUT/DELETE de datos).
> La única petición de escritura fue `POST /auth/login`, necesaria para obtener
> el token de cada cuenta. No se creó, editó ni borró ningún registro.

---

## 1. Resumen ejecutivo

| Área | Resultado |
|---|---|
| Build de producción | ✅ Correcto — 0 errores |
| Lint | ✅ 0 errores, 3 avisos preexistentes |
| Catálogo público | ✅ 4 pestañas con datos reales |
| Autenticación (4 cuentas) | ✅ Las 4 entran y devuelven los roles correctos |
| Badges de rol | ✅ functioning en barra y panel |
| Contraste WCAG | ✅ 20 de 21 pares cumplen |
| **Panel de gestión** | ❌ **Solo funciona para ADMIN** |

**Hallazgo crítico:** OPERADOR y GESTOR ven en su interfaz módulos que la API les
nega con `403`. El panel de gestión está roto para 2 de los 4 roles.

---

## 2. Matriz de permisos real

Códigos HTTP obtenidos ejecutando cada endpoint con el token de cada cuenta.

| Endpoint | turista | op | gestor | admin |
|---|:---:|:---:|:---:|:---:|
| `/categories/public` | 200 | 200 | 200 | 200 |
| `/accounts/me` | 200 | 200 | 200 | 200 |
| `/recommendations/attractions` | 200 | 200 | 200 | 200 |
| `/attractions/admin` | 403 | 403 | **403** | 200 |
| `/events/admin` | 403 | 403 | **403** | 200 |
| `/commerces/admin` | 403 | 403 | 403 | 200 |
| `/services/admin` | 403 | 403 | 403 | 200 |
| `/commerces/mine` | 403 | **403** | 403 | 200 |
| `/events/mine` | 403 | 403 | 200 | 200 |
| `/categories` | 403 | 403 | 403 | 200 |

Reproducir: `node docs/pruebas/test-permisos.mjs`

### Qué ve el usuario vs. qué le responde la API

El frontend arma sus pestañas en `src/app/page.tsx:303-306` y las carga con
`listManaged()` en `src/lib/catalog/management-api.ts:14-20`.

| Cuenta | Pestañas que le aparecen | Resultado |
|---|---|---|
| `turista@` | *(ninguna)* | Correcto |
| `op@` | Comercios, Servicios, Eventos de comercio | ❌ Todos fallan con 403 |
| `gestor@` | Atractivos, Eventos | ❌ Ambos fallan con 403 |
| `admin@` | Todos + Categorías | ✅ Todo funciona |

**Pasos para reproducir (OPERADOR):**
1. Iniciar sesión con `op@taminaka.com` / `Admin123!`
2. Pulsar **Gestionar**
3. Aparece el error 403 y el listado queda vacío

**Causa probable:** el backend no aplica el rol `OPERADOR` ni el `GESTOR` como
autorización en los endpoints de panel; solo reconoce `ADMIN`.

---

## 3. Identidad de las cuentas

| Correo | Nombre | Roles devueltos | Modo activo |
|---|---|---|---|
| `turista@taminaka.com` | Turista Tamaka | `TURISTA` | TURISTA |
| `op@taminaka.com` | Operador Tayrona | `TURISTA, OPERADOR` | TURISTA |
| `gestor@taminaka.com` | Gestor Santa Marta | `TURISTA, GESTOR` | TURISTA |
| `admin@taminaka.com` | Administrador Tamaka | `TURISTA, ADMIN` | TURISTA |

Los 4 roles coinciden con lo indicado por el equipo. El token es JWT y la sesión
persiste en `localStorage`.

---

## 4. Hallazgos técnicos

### Prioridad alta

**4.1 — El panel de gestión no funciona para OPERADOR ni GESTOR**
Detalle en la sección 2. Es el hallazgo que más afecta al prototipo.

**4.2 — Las imágenes de las tarjetas se desbordan de su contenedor**

`.card-image` mide 185 px de alto, pero las imágenes miden 259 px en promedio y
hasta **584 px** cuando la foto es vertical (Playa El Rodadero, 1200×1800).

Causa: `.card-image` es un contenedor Grid con `place-items: center`, así que el
`<img>` es un ítem con altura automática. Por eso su `height: 100%` no se resuelve
y `object-fit: cover` nunca llega a aplicarse. Como el contenedor no tiene
`overflow: hidden`, la imagen se sale y pisa el texto de la tarjeta.

Medición real tomada en el navegador:

| Tarjeta | Caja | Imagen | Natural |
|---|---:|---:|---|
| Tayrona | 185 px | 259 px | 1200×798 |
| Playa El Rodadero | 185 px | **584 px** | 1200×1800 |
| Quinta | 185 px | 260 px | 1200×801 |
| Ciudad Perdida | 185 px | 259 px | 1200×800 |
| Minca | 185 px | 259 px | 1200×800 |

Es un defecto de CSS, **preexistente al refactor de color** (el selector no se
tocó). Se corrige con `overflow: hidden` en `.card-image`, o dando altura definida
al `<img>`. **No se corrigió** porque queda fuera del alcance acordado.

### Prioridad media

**4.3 — El modal de detalle nunca muestra las imágenes**

`page.tsx:294` pinta `{offer.name.slice(0, 1)}` — la inicial del nombre — en lugar
de `offer.images[0]`. Toda la API entrega imágenes y ninguna se ve en el detalle.

**4.4 — Credenciales de administrador precargadas en el login**

`page.tsx:295-296` inicializa el formulario con `admin@tamaka.com` y `Admin123!`.
Está publicado en producción. Cualquier visitante ve las credenciales de admin.

**4.5 — OPERADOR ve el selector de comercio vacío en Eventos**

`page.tsx:338` carga los comercios solo cuando `type === "services"`, pero el
selector también se pinta en `page.tsx:430` cuando `type === "events" && !isGestor`.
El operador entra a "Eventos de comercio" y no puede elegir comercio.

**4.6 — Cuatro funciones de autenticación sin interfaz**

`src/lib/auth/api.ts` define `register`, `verifyAccount`, `requestPasswordReset` y
`resetPassword`. Los cuatro endpoints existen en la API y ninguna tiene pantalla.

### Prioridad baja (accesibilidad)

**4.7 — Modales sin semántica de diálogo.** Sin `role="dialog"`, `aria-modal`,
`aria-labelledby`, cierre con `Escape` ni trampa de foco.

**4.8 — `<html lang="en">`** en una aplicación íntegramente en español (`layout.tsx:28`).

**4.9 — Fuente Geist cargada pero sin usar.** `layout.tsx` la carga, pero
`globals.css` define `font-family: Arial, Helvetica, sans-serif`.

**4.10 — El borde `#e2e8f0` no alcanza 3:1.** Como separador decorativo es correcto,
pero también se usa en los `<input>`, donde WCAG 1.4.11 sí exige 3:1.

**4.11 — `page.module.css` es código muerto.** Es el boilerplate de
`create-next-app` y `page.tsx` no lo importa.

**4.12 — Sin estado de carga.** Mientras llega la respuesta se muestra
"No encontramos resultados para esta búsqueda.", que parece un fallo.

---

## 5. Refactor de color

Paleta **"Sostenibilidad Caribeña"** aplicada sobre `src/app/globals.css`.

| Rol del color | Token | Hex |
|---|---|---|
| Azul Mar Caribe | `--primary` | `#006699` |
| Verde Sierra Nevada | `--secondary` / `--ok` | `#15803d` |
| Arena / Sol | `--accent-gold` | `#d97706` |
| Fondo | `--background` | `#f8fafc` |
| Superficie | `--surface` | `#ffffff` |
| Texto | `--foreground` | `#0f172a` |
| Texto secundario | `--muted` | `#475569` |
| Bordes | `--border-color` | `#e2e8f0` |

### Ajustes de contraste aplicados

| Valor propuesto | Hex | Ratio | Decisión |
|---|---|---|---|
| Ámbar para texto | `#d97706` | 3.19:1 | ❌ No apto → se usa `#b45309` (5.02:1) |
| Texto secundario | `#64748b` | 4.76:1 | ⚠️ Justo en texto de 11-12 px → `#475569` (7.58:1) |

`#d97706` queda solo en superficies grandes y bordes decorativos.

### Resultado de la verificación de contraste

`20 de 21 pares cumplen`. El único que no cumple es el borde `#e2e8f0` (1.23:1),
correcto como separador pero insuficiente como borde de input (hallazgo 4.10).

Mejor ratio de texto: 17.85:1. Peor entre los aprobados: 4.79:1.

---

## 6. Badges de rol

Implementados como JSX presentacional, sin alterar ninguna condición ni llamada
a la API. Muestran el rol de mayor jerarquía en la barra superior
(`ADMIN > GESTOR > OPERADOR > TURISTA`) y todos los roles en el panel.

| Rol | Fondo | Texto | Contraste |
|---|---|---|---|
| ADMIN | `#e0e7ff` | `#3730a3` | 8.06:1 |
| GESTOR | `#fef3c7` | `#92400e` | 6.37:1 |
| OPERADOR | `#e0f2fe` | `#075985` | 6.59:1 |
| TURISTA | `#d1fae5` | `#065f46` | 6.78:1 |

---

## 7. Verificación en navegador

Realizada con Chrome 155 headless mediante el protocolo DevTools, sin instalar
ninguna dependencia adicional.

| Prueba | Resultado |
|---|---|
| Vista pública 1440 px | ✅ 5 tarjetas con imágenes reales |
| Vista pública 768 px | ✅ |
| Vista pública 390 px | ✅ |
| Badge ADMIN en barra | ✅ |
| Badge GESTOR en barra | ✅ |
| Badge OPERADOR en barra | ✅ |
| Badge TURISTA en barra | ✅ |
| Panel con ADMIN | ✅ 5 filas, badges `TURISTA` y `ADMIN` |
| Errores de consola | ✅ Ninguno |

Las comprobaciones del catálogo que salieron vacías en las primeras capturas
eran un defecto de mi script de espera, no de la aplicación: verificado después
contra el DOM real (5 tarjetas, 7 categorías, 0 errores).

---

## 8. Alcance de este refactor

**Modificado:**
- `src/app/globals.css` — solo valores de color. Estructura, tipografía,
  espaciado y breakpoints intactos. Copia en `globals.css.bak`.
- `src/app/page.tsx` — solo los badges de rol. Copia en `page.tsx.bak`.

**No modificado:** ninguna lógica, ninguna llamada a la API, ninguna condición.

**Producción:** intacta. El `.env.local` con la URL de la API está cubierto por
`.gitignore` (`.env*.local`) y `.dockerignore` (`.env*`).

---

## 9. Cómo reproducir las pruebas

```bash
npm install
npm run build
npm run lint
npm run dev

# Matriz de permisos
node docs/pruebas/test-permisos.mjs

# Contraste WCAG
node docs/pruebas/test-contraste.mjs

# Alturas de las imágenes
node docs/pruebas/diag-alturas.mjs
```

Los scripts no requieren dependencias adicionales: usan el `fetch` y el
`WebSocket` nativos de Node 18+.
