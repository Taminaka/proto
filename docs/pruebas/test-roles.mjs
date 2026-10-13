// Matriz de pruebas por rol contra la API de produccion.
// SOLO LECTURA + login. Ningun POST/PUT/DELETE de datos.
const API = "https://proto-api.taminaka.com/api";

const CUENTAS = [
  { email: "turista@taminaka.com", esperado: ["TURISTA"] },
  { email: "op@taminaka.com", esperado: ["OPERADOR", "TURISTA"] },
  { email: "gestor@taminaka.com", esperado: ["GESTOR", "TURISTA"] },
  { email: "admin@taminaka.com", esperado: ["ADMIN", "TURISTA"] },
];
const PASSWORD = "Admin123!";

let fallos = 0;
let total = 0;
function check(ok, texto) {
  total++;
  if (!ok) fallos++;
  console.log(`  ${ok ? "OK   " : "FALLA"} ${texto}`);
};

async function login(email) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const body = await r.json().catch(() => ({}));
  return { status: r.status, body };
}

// GET que exige token
async function get(path, token) {
  const r = await fetch(`${API}${path}`, {
    headers: { accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

console.log("=".repeat(64));
console.log("MATRIZ DE PRUEBAS — SOLO LECTURA");
console.log("=".repeat(64));

// ---------- Anonimo ----------
console.log("\n[1] Visitante anonimo (sin sesion)");
{
  const cat = await get("/categories/public");
  check(cat.status === 200 && Array.isArray(cat.body), `GET /categories/public -> ${cat.status} (${Array.isArray(cat.body) ? cat.body.length + " items" : "no array"})`);
  const rec = await get("/recommendations/attractions");
  check(rec.status === 403, `GET /recommendations/attractions sin token -> ${rec.status} (se espera 403)`);
  const me = await get("/accounts/me");
  check(me.status === 403, `GET /accounts/me sin token -> ${me.status} (se espera 403)`);
}

// ---------- Endpoints publicos ----------
console.log("\n[2] Catalogo publico (sin token)");
for (const p of ["/attractions/public", "/commerces/public", "/services/public", "/events/public"]) {
  const r = await get(p);
  check(r.status === 200 && Array.isArray(r.body), `GET ${p} -> ${r.status} (${Array.isArray(r.body) ? r.body.length + " items" : "no array"})`);
}

// ---------- Detalle ----------
console.log("\n[3] Detalle publico");
for (const [base, n] of [["/attractions/public", 1], ["/commerces/public", 1], ["/services/public", 1], ["/events/public", 1]]) {
  const r = await get(`${base}/${n}`);
  check(r.status === 200 && r.body?.id === n, `GET ${base}/${n} -> ${r.status}`);
}

// ---------- Login por rol ----------
console.log("\n[4] Autenticacion y permisos por rol");
const sesiones = [];

for (const cuenta of CUENTAS) {
  console.log(`\n  --- ${cuenta.email} ---`);
  const { status, body } = await login(cuenta.email);
  check(status === 200, `POST /auth/login -> ${status}`);
  if (status !== 200) {
    console.log(`       respuesta: ${JSON.stringify(body).slice(0, 200)}`);
    continue;
  }

  const token = body.token;
  check(typeof token === "string" && token.length > 10, `token recibido (${String(token).slice(0, 12)}...)`);

  // Roles devueltos vs esperados
  const roles = body.roles ?? [];
  const orden = ["ADMIN", "GESTOR", "OPERADOR", "TURISTA"];
  console.log(`       roles: [${roles.join(", ")}]  modo: ${body.activeMode}`);
  for (const r of cuenta.esperado) {
    check(roles.includes(r), `contiene el rol ${r}`);
  }
  check(cuenta.esperado.every((r) => roles.includes(r)), `coincide con lo esperado [${cuenta.esperado.join(", ")}]`);
  check(body.email === cuenta.email, `email de respuesta = ${body.email}`);
  check(body.fullName === cuenta.email, `nombre de respuesta = ${body.fullName}`);
  check(["TURISTA", "OPERADOR"].includes(body.activeMode), `activeMode valido = ${body.activeMode}`);

  // Perfil
  const me = await get("/accounts/me", token);
  check(me.status === 200, `GET /accounts/me -> ${me.status}`);
  if (me.status === 200) {
    check(me.body?.email === cuenta.email, `perfil email = ${me.body?.email}`);
    check(Array.isArray(me.body?.roles), `perfil trae roles: [${(me.body?.roles ?? []).join(", ")}]`);
  }

  // Recomendaciones
  const rec = await get("/recommendations/attractions", token);
  check(rec.status === 200, `GET /recommendations/attractions con token -> ${rec.status}`);
  const nRec = Array.isArray(rec.body?.items) ? rec.body.items.length : 0;
  console.log(`       recomendaciones devueltas: ${nRec}`);

  // Permisos de gestion
  const esAdmin = roles.includes("ADMIN");
  const esGestor = roles.includes("GESTOR");
  const esOperador = roles.includes("OPERADOR");

  // Endpoints de panel. Solo GET: no se escribe nada.
  const paneles = [
    ["/attractions/admin", esGestor, "atractivos"],
    ["/events/admin", esGestor, "eventos"],
    ["/commerces/admin", esAdmin, "comercios"],
    ["/services/admin", esAdmin, "servicios"],
    ["/commerces/mine", esOperador || esAdmin, "mis comercios"],
    ["/events/mine", esOperador || esAdmin, "mis eventos"],
    ["/categories", esAdmin, "categorias (todas)"],
  ];
  for (const [path, permitido, etiqueta] of paneles) {
    const r = await get(path, token);
    const ok = permitido ? r.status === 200 : r.status !== 200;
    check(ok, `${permitido ? "puede" : "NO puede"} ${etiqueta} (${path}) -> ${r.status}`);
  }

  sesiones.push({ email: cuenta.email, roles, activeMode: body.activeMode });
}

// ---------- Alternativas ----------
console.log("\n[5] Alternativas de atractivo (endpoint de recomendaciones)");
if (sesiones.length) {
  const { body } = await login("admin@taminaka.com");
  if (body?.token) {
    const alt = await get("/attractions/public/1/alternatives", body.token);
    check(alt.status === 200, `GET /attractions/public/1/alternatives -> ${alt.status}`);
    const n = Array.isArray(alt.body?.items) ? alt.body.items.length : "sin items";
    console.log(`       contenido: ${JSON.stringify(alt.body).slice(0, 120)}`);
    console.log(`       items: ${n}`);
  }
}

// ---------- Resumen ----------
console.log("\n" + "=".repeat(64));
console.log(`RESULTADO: ${total - fallos}/${total} comprobaciones correctas`);
if (fallos === 0) console.log("TODAS LAS COMPROBACIONES PASARON");
else console.log(`${fallos} FALLAS`);
console.log("=".repeat(64));
console.log("\nResumen de sesiones:");
for (const s of sesiones) {
  console.log(`  ${s.email.padEnd(24)} roles=[${s.roles.join(", ")}]  modo=${s.activeMode}`);
}
process.exit(fallos === 0 ? 0 : 1);
