# Tamaka — Wireframes y navegación

Documento generado a partir de la aplicación desplegada en `https://proto.taminaka.com`
y del código fuente (`src/app/page.tsx`, `src/app/globals.css`).

**Origen:** el repositorio no incluye wireframes. Estos se reconstruyeron desde la
implementación real, que es la referencia vigente del diseño.

## Arquitectura de navegación

La aplicación es de **una sola ruta** (`/`). No hay enrutado: la navegación se resuelve
con estados de React (`active`, `selected`, `authOpen`, `accountOpen`, `managementOpen`)
y anclas al documento (`#explore`, `#recommendations`).

```mermaid
flowchart TD
    Root["/ — pagina unica"]

    Root --> Topbar
    Root --> Hero
    Root --> Explore["#explore — Explorar Santa Marta"]
    Root --> Feature["Franja de recomendaciones"]
    Root --> Recs["#recommendations — Recomendaciones"]
    Root --> Strip["Franja de sesion activa (solo con sesion)"]
    Root --> Footer

    Topbar -->|"ancla"| Explore
    Topbar -->|"ancla"| Recs
    Topbar -->|"boton Gestionar"| Panel
    Topbar -->|"nombre de usuario"| Account
    Topbar -->|"Iniciar sesion"| Auth
    Topbar -->|"boton menu (movil)"| Menu

    Menu -->|"ancla"| Explore
    Menu -->|"ancla"| Recs
    Menu -->|"Gestionar"| Panel
    Menu -->|"Editar cuenta"| Account

    Hero -->|"buscador, submit"| Explore
    Feature -->|"Ver recomendaciones"| Recs

    Explore --> Tabs{"pestanas"}
    Tabs --> A1["Atractivos"]
    Tabs --> C1["Comercios"]
    Tabs --> S1["Servicios"]
    Tabs --> E1["Eventos"]

    Explore --> Filters["filtro por categoria"]
    Filters --> Explore

    A1 --> Detail
    C1 --> Detail
    S1 --> Detail
    E1 --> Detail

    Detail["Modal de detalle"]
    Detail -->|"cerrar"| Explore

    Recs --> Detail

    Auth["Modal iniciar sesion"] -->|"login OK"| Topbar
    Account["Modal editar perfil"] -->|"guardar"| Topbar
    Panel["Panel de gestion"] --> Panel

    Panel --> PTabs{"modulos por rol"}
    PTabs --> PA["Atractivos"]
    PTabs --> PC["Comercios"]
    PTabs --> PS["Servicios"]
    PTabs --> PE["Eventos"]
    PTabs --> PCat["Categorias (solo ADMIN)"]

    Panel --> PForm["Formulario crear / editar"]
    Panel --> PList["Lista de elementos"]

    style Root fill:#006699,color:#fff
    style Panel fill:#b45309,color:#fff
    style Detail fill:#15803d,color:#fff
```

## Permisos de navegación por rol

| Elemento de navegación | TURISTA | OPERADOR | GESTOR | ADMIN |
|---|---|---|---|---|
| Explorar (catálogo) | Sí | Sí | Sí | Sí |
| Recomendaciones | Sí (con sesión) | Sí | Sí | Sí |
| Iniciar sesión | Sí | Sí | Sí | Sí |
| **Gestionar** | **No** | Sí | Sí | Sí |
| Módulos del panel | — | Comercios, Servicios, Eventos | Atractivos, Eventos | Todos |
| Categorías | — | No | No | Sí |

> **Nota crítica:** la navegación ofrece esos módulos, pero la API de producción
> solo responde `200` a `ADMIN`. Ver `INFORME-PRUEBAS.md`.

---

## Vista 1 — Inicio público

```mermaid
flowchart TD
    V["INICIO PÚBLICO"]
    V --> Topbar["Barra superior<br/>TAMAKA. · Explorar · Recomendaciones · Gestionar<br/>Iniciar sesión · ☰"]
    V --> Hero["Hero — 2 columnas<br/>Santa Marta · Colombia<br/>Encuentra tu próxima experiencia.<br/>[ ¿Qué quieres descubrir? ] [Buscar]<br/>Arte: gradiente Caribe"]
    V --> Explore["Sección Explora Santa Marta<br/>pestañas + ver todo"]
    V --> Band["Franja oscura<br/>Recomendaciones para ti<br/>[Ver recomendaciones →]  01—03"]
    V --> Recs["Sección Recomendaciones<br/>malla de tarjetas con motivo"]
    V --> Strip["Hola, nombre. — franja de sesión<br/>Tu cuenta está activa"]
    V --> Foot["Pie: TAMAKA. · Turismo que se siente. · © 2026"]

    style Hero fill:#006699,color:#fff
    style Band fill:#0f172a,color:#fff
    style Topbar fill:#e6eff6
```

### Barra superior con sesión

```
┌──────────────────────────────────────────────────────────────────────┐
│  TAMAKA▪          Explorar  Recomendaciones  Gestionar              │
│                                                    Nombre [GESTOR]  │
│                                                    Salir      ☰     │
└──────────────────────────────────────────────────────────────────────┘
```

El **badge de rol** se inserta entre el nombre y "Salir". Con varios roles se
muestra el de mayor jerarquía (ADMIN > GESTOR > OPERADOR > TURISTA).

| Rol | Badge | Color |
|---|---|---|
| ADMIN | `ADMIN` | índigo `#e0e7ff` / `#3730a3` |
| GESTOR | `GESTOR` | ámbar `#fef3c7` / `#92400e` |
| OPERADOR | `OPERADOR` | cielo `#e0f2fe` / `#075985` |
| TURISTA | `TURISTA` | esmeralda `#d1fae5` / `#065f46` |

---

## Vista 2 — Catálogo con pestañas

```
┌──────────────────────────────────────────────────────────────────────┐
│  OFERTA TURÍSTICA                          Ver todo →               │
│  Explora Santa Marta                                                 │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Atractivos │ Comercios │ Servicios │ Eventos        ← pestañas │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  [ Todas las categorías ▾ ]  [ Aplicar filtros ]   ← filtros        │
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                        │
│  │   imagen   │ │   imagen   │ │   imagen   │   ← 3 columnas        │
│  │   [LOW]    │ │  [MEDIUM]  │ │   [LOW]    │   ← badge ocupación   │
│  ├────────────┤ ├────────────┤ ├────────────┤                        │
│  │NATURALEZA  │ │PLAYAS      │ │PATRIMONIO  │   ← categoría        │
│  │ Tayrona    │ │ Rodadero   │ │ Quinta     │   ← nombre            │
│  │ descripción│ │ descripción│ │ descripción│   ← descripción      │
│  │ Ver detalle│ │ Ver detalle│ │ Ver detalle│                        │
│  └────────────┘ └────────────┘ └────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
```

**Estados:** con resultados · vacío (`No encontramos resultados para esta
búsqueda.`) · error (`.notice.error` sobre la rejilla).

**Responsive:** 3 columnas → 2 bajo 800px → 1 bajo 520px.

---

## Vista 3 — Modal de detalle

```
        ┌────────────────────────────────────────────┐
        │  ▓▓▓ fondo oscurecido ▓▓▓                 │
        │   ┌──────────────────────────────────┐   × │
        │   │      [ imagen o inicial ]        │     │
        │   ├──────────────────────────────────┤     │
        │   │ NATURALEZA · AVENTURA            │     │
        │   │ Tayrona                          │     │
        │   │ Uno de los destinos más          │     │
        │   │ representativos del Caribe...   │     │
        │   │ ⌖ Entrada El Zaino               │     │
        │   │ Ocupación actual: LOW            │     │
        │   │ [ Cerrar detalle ]               │     │
        │   └──────────────────────────────────┘     │
        └────────────────────────────────────────────┘
```

> **Hallazgo documentado:** el bloque de imagen del modal muestra la inicial del
> nombre en lugar de `offer.images[0]`. Es una limitación conocida, no un error de
> este refactor. Ver `INFORME-PRUEBAS.md`.

---

## Vista 4 — Autenticación y perfil

### Modal de inicio de sesión

```
   ┌──────────────────────────┐
   │ Tu cuenta            ×  │
   │ Iniciar sesión           │
   │ Correo   [____________]  │
   │ Contraseña[____________]  │
   │ [ Entrar ]               │
   └──────────────────────────┘
```

### Modal de editar perfil

```
   ┌──────────────────────────────┐
   │ Tu cuenta                ×  │
   │ Editar perfil           [GESTOR]
   │  ( P ) [Cambiar foto]        │
   │  Nombre completo [______]    │
   │  Correo         [______] ⃠   │  ← deshabilitado
   │  Teléfono        [______]    │
   │  Dirección       [______]    │
   │  [ Guardar cambios ]          │
   │  ─────────────────────────    │
   │  Modo activo: OPERADOR       │
   │  [ Cambiar a modo turista ]   │
   └──────────────────────────────┘
```

Si el usuario **no** tiene rol OPERADOR, el bloque inferior se sustituye por el
formulario «Habilitar mi operación» (negocio, NIT, dirección, teléfono).

---

## Vista 5 — Panel de gestión

```
┌───────────────────────────────────────────────────────────────────────┐
│ Panel de gestión                                                  ×    │
│ Administrar Tamaka          [ADMIN] [TURISTA]     ← badges de rol     │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ [ Atractivos ▾ ] [ Nuevo ]                                        │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────┐ ┌─────────────────────────────────┐ │
│ │ ELEMENTOS                   │ │ Crear Atractivos                │ │
│ │ ─────────────────────────── │ │ Nombre       [____________]     │ │
│ │ Tayrona              ACTIVO  │ │ Descripción  [____________]     │ │
│ │            [Editar] [Desact]│ │ Dirección    [____________]     │ │
│ │ ─────────────────────────── │ │ Capacidad    [______]           │ │
│ │ Rodadero             ACTIVO  │ │ Categorías                      │ │
│ │            [Editar] [Desact]│ │  [Naturaleza] [Playas] ...      │ │
│ │                             │ │ Imágenes [Subir]                 │ │
│ │                             │ │ [ Crear ]                        │ │
│ └─────────────────────────────┘ └─────────────────────────────────┘ │
│ ─────────────────────────────────────────────────────────────────── │
│ Categorías                        ← solo ADMIN                        │
│ [ Nombre ][ Descripción ] [ Crear categoría ]                        │
│ [Playas ×] [Naturaleza ×] [Aventura ×]                              │
└───────────────────────────────────────────────────────────────────────┘
```

**Módulos por rol:**

| Rol | Módulos disponibles |
|---|---|
| ADMIN | Atractivos, Eventos, Comercios, Servicios, Eventos de comercio, Categorías |
| GESTOR | Atractivos, Eventos |
| OPERADOR | Comercios, Servicios, Eventos de comercio |

**Responsive:** el panel es de 2 columnas; bajo 760px pasa a 1 columna y la barra
de herramientas se apila.

---

## Paleta aplicada

```mermaid
flowchart LR
    subgraph Marca
      P["--primary<br/>#006699<br/>Azul Mar Caribe"]
      S["--secondary<br/>#15803d<br/>Verde Sierra Nevada"]
      A["--accent-gold<br/>#d97706<br/>Arena / Sol"]
    end
    subgraph Neutros
      BG["--background<br/>#f8fafc"]
      SU["--surface<br/>#ffffff"]
      FG["--foreground<br/>#0f172a"]
      MU["--muted<br/>#475569"]
      BO["--border-color<br/>#e2e8f0"]
    end
    subgraph Estados
      OK["--ok<br/>#15803d"]
      WA["--warn<br/>#b45309"]
      DA["--danger<br/>#b91c1c"]
    end

    style P fill:#006699,color:#fff
    style S fill:#15803d,color:#fff
    style A fill:#d97706,color:#fff
```

Todas las combinaciones de texto verificadas contra **WCAG 2.1 AA** (4.5:1).
Resultados en `test-contraste.mjs`.
