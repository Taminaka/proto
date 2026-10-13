// Matriz de permisos real: que endpoint responde que a cada rol.
const API = "https://proto-api.taminaka.com/api";
const PASSWORD = "Admin123!";

const CUENTAS = [
  "turista@taminaka.com",
  "op@taminaka.com",
  "gestor@taminaka.com",
  "admin@taminaka.com",
];

const ENDPOINTS = [
  ["/categories/public", "catalogo publico"],
  ["/accounts/me", "mi perfil"],
  ["/recommendations/attractions", "recomendaciones"],
  ["/attractions/admin", "panel: TODOS los atractivos"],
  ["/events/admin", "panel: TODOS los eventos"],
  ["/commerces/admin", "panel: TODOS los comercios"],
  ["/services/admin", "panel: TODOS los servicios"],
  ["/commerces/mine", "panel: MIS comercios"],
  ["/events/mine", "panel: MIS eventos"],
  ["/categories", "panel: TODAS las categorias"],
];

async function login(email) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  return r.json();
}

const tokens = {};
const info = {};
for (const email of CUENTAS) {
  const body = await login(email);
  tokens[email] = body.token;
  info[email] = { roles: body.roles ?? [], mode: body.activeMode, name: body.fullName };
}

console.log("=".repeat(76));
console.log("MATRIZ DE PERMISOS REAL — codigo HTTP por rol");
console.log("=".repeat(76));
console.log("\nLeyenda:  200 permitido   403 prohibido   otro = error\n");

const header = ["Endpoint".padEnd(36), ...CUENTAS.map((e) => e.split("@")[0].padStart(9))].join(" ");
console.log(header);
console.log("-".repeat(76));

for (const [path, label] of ENDPOINTS) {
  const cells = [];
  for (const email of CUENTAS) {
    const r = await fetch(`${API}${path}`, {
      headers: { accept: "application/json", Authorization: `Bearer ${tokens[email]}` },
    });
    cells.push(String(r.status).padStart(9));
  }
  console.log(label.padEnd(36) + cells.join(" "));
}

console.log("\n" + "=".repeat(76));
console.log("IDENTIDAD DE LAS CUENTAS");
console.log("=".repeat(76));
for (const email of CUENTAS) {
  const i = info[email];
  console.log(`  ${email}`);
  console.log(`    nombre: ${i.name}`);
  console.log(`    roles:  [${i.roles.join(", ")}]`);
  console.log(`    modo:   ${i.mode}`);
}

console.log("\n" + "=".repeat(76));
console.log("CRUCE: QUE ESPERA EL FRONTEND VS QUE RESPONDE LA API");
console.log("=".repeat(76));
console.log("\nEl frontend decide las pestanas en page.tsx:303-306 y llama");
console.log("listManaged() en management-api.ts:14-20.\n");

async function probe(email, path) {
  const r = await fetch(`${API}${path}`, {
    headers: { accept: "application/json", Authorization: `Bearer ${tokens[email]}` },
  });
  return r.status;
}

const problemas = [];
for (const email of CUENTAS) {
  const roles = info[email].roles;
  const esAdmin = roles.includes("ADMIN");
  const esGestor = roles.includes("GESTOR");
  const esOperador = roles.includes("OPERADOR");

  if (esGestor) {
    const s1 = await probe(email, "/attractions/admin");
    const s2 = await probe(email, "/events/admin");
    if (s1 !== 200) problemas.push(`${email} ve la pestana Atractivos pero /attractions/admin responde ${s1}`);
    if (s2 !== 200) problemas.push(`${email} ve la pestana Eventos pero /events/admin responde ${s2}`);
  }
  if (esOperador || esAdmin) {
    if (!esAdmin) {
      const s = await probe(email, "/commerces/mine");
      if (s !== 200) problemas.push(`${email} ve "Mis comercios" pero /commerces/mine responde ${s}`);
    }
  }
}

if (problemas.length === 0) {
  console.log("  Sin discrepancias: el frontend y la API coinciden.");
} else {
  for (const p of problemas) console.log(`  [BUG] ${p}`);
}
console.log("\n" + "=".repeat(76));
