// Captura de la aplicacion en todos sus estados via Chrome DevTools Protocol.
// No requiere ninguna libreria: usa el WebSocket global de Node 22+.
import { writeFileSync, mkdirSync } from "node:fs";

const APP = "http://localhost:3000";
const API = "https://proto-api.taminaka.com/api";
const OUT = "C:/Users/jejim/AppData/Local/Temp/opencode/shots";
mkdirSync(OUT, { recursive: true });

const CUENTAS = [
  { email: "admin@taminaka.com", nombre: "admin" },
  { email: "gestor@taminaka.com", nombre: "gestor" },
  { email: "op@taminaka.com", nombre: "operador" },
  { email: "turista@taminaka.com", nombre: "turista" },
];

// --- Conexion CDP -------------------------------------------------------
const { webSocketDebuggerUrl } = await (await fetch("http://localhost:9222/json/version")).json();
const targets = await (await fetch("http://localhost:9222/json")).json();
let target = targets.find((t) => t.type === "page");
if (!target) {
  await fetch(`http://localhost:9222/json/new?about:blank`, { method: "PUT" });
  target = (await (await fetch("http://localhost:9222/json")).json()).find((t) => t.type === "page");
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener("open", res, { once: true });
  ws.addEventListener("error", rej, { once: true });
});

let id = 0;
const pendientes = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pendientes.has(msg.id)) {
    const { resolve, reject } = pendientes.get(msg.id);
    pendientes.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
});

function send(method, params = {}) {
  const msgId = ++id;
  return new Promise((resolve, reject) => {
    pendientes.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function evaluar(expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " :: " + expression.slice(0, 80));
  return r.result.value;
}

async function capturar(nombre, { fullPage = true } = {}) {
  const params = { format: "png" };
  if (fullPage) params.captureBeyondViewport = true;
  const { data } = await send("Page.captureScreenshot", params);
  const ruta = `${OUT}/${nombre}.png`;
  writeFileSync(ruta, Buffer.from(data, "base64"));
  console.log(`  capturado  ${ruta}`);
}

async function viewport(w, h) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: w, height: h, deviceScaleFactor: 1, mobile: w < 768,
  });
}

async function irA(url) {
  await send("Page.navigate", { url });
  await dormir(1200);
  // La app NO tiene estado de carga: en el primer pintado ya aparece el
  // texto "No encontramos resultados". Por eso hay que esperar a que
  // existan TAREJAS, no a que exista cualquier contenido.
  for (let i = 0; i < 40; i++) {
    const listo = await evaluar(`document.querySelectorAll('.offer-card').length > 0`);
    if (listo) break;
    await dormir(500);
  }
  const n = await evaluar(`document.querySelectorAll('.offer-card').length`);
  if (n === 0) throw new Error(`No llegaron tarjetas al capturar ${url}`);
  console.log(`  listo: ${n} tarjetas`);
  await dormir(1200);
}

await send("Page.enable");
await send("Runtime.enable");

// --- 1. Vista publica, anonimo, tres anchos ---------------------------
console.log("\n[1] Vista publica (anonimo)");
for (const [w, h, etiqueta] of [[1440, 1000, "escritorio"], [768, 1024, "tablet"], [390, 844, "movil"]]) {
  await viewport(w, h);
  await irA(APP);
  await capturar(`01-publico-${etiqueta}-${w}px`);
}

// --- 2. Sesiones por rol ------------------------------------------------
console.log("\n[2] Barra superior con badge de rol");
await viewport(1440, 1000);

for (const cuenta of CUENTAS) {
  const login = await evaluar(`
    (async () => {
      const r = await fetch("${API}/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ${JSON.stringify(cuenta.email)}, password: "Admin123!" })
      });
      const s = await r.json();
      if (!s.token) return { error: "sin token" };
      localStorage.setItem("tamaka.auth.session", JSON.stringify(s));
      return { roles: s.roles, name: s.fullName };
    })()
  `);
  console.log(`  ${cuenta.email} -> ${JSON.stringify(login)}`);

  await irA(APP);
  await dormir(1500);
  const tarjetas = await evaluar(`document.querySelectorAll('.offer-card').length`);
  const badgeTxt = await evaluar(`
    JSON.stringify([...document.querySelectorAll('.account-actions .role-badge')].map(b => b.textContent.trim()))
  `);
  console.log(`  tarjetas: ${tarjetas}   badges en barra: ${badgeTxt}`);
  // Recorta a la barra superior para ver el badge de cerca
  const { data } = await send("Page.captureScreenshot", {
    format: "png",
    clip: { x: 0, y: 0, width: 1440, height: 80, scale: 2 },
  });
  writeFileSync(`${OUT}/02-badge-${cuenta.nombre}.png`, Buffer.from(data, "base64"));
  console.log(`  capturado  02-badge-${cuenta.nombre}.png`);

  await evaluar(`localStorage.removeItem("tamaka.auth.session"); true`);
}

// --- 3. Panel de gestion con admin --------------------------------------
console.log("\n[3] Panel de gestion (admin)");
const admin = await evaluar(`
  (async () => {
    const r = await fetch("${API}/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@taminaka.com", password: "Admin123!" })
    });
    const s = await r.json();
    localStorage.setItem("tamaka.auth.session", JSON.stringify(s));
    return { roles: s.roles };
  })()
`);
console.log(`  sesion admin: ${JSON.stringify(admin)}`);

await irA(APP);
await dormir(2000);

// Abre el panel pulsando el boton Gestionar
const abrio = await evaluar(`
  (() => {
    const b = [...document.querySelectorAll("button")].find(x => x.textContent.trim() === "Gestionar");
    if (b) { b.click(); return true; }
    return false;
  })()
`);
console.log(`  boton Gestionar encontrado y pulsado: ${abrio}`);
await dormir(3000);
// Espera a que el panel cargue su listado
for (let i = 0; i < 30; i++) {
  const listo = await evaluar(`document.querySelectorAll('.management-row').length > 0`);
  if (listo) break;
  await dormir(500);
}
await dormir(1000);
console.log(`  filas en el panel: ${await evaluar(`document.querySelectorAll('.management-row').length`)}`);
console.log(`  badges en el panel: ${await evaluar(`JSON.stringify([...document.querySelectorAll('.management-modal .role-badge')].map(b=>b.textContent.trim()))`)}`);
await capturar("03-panel-admin");

await evaluar(`localStorage.removeItem("tamaka.auth.session"); true`);

// --- 4. Errores de consola ---------------------------------------------
console.log("\n[4] Consola del navegador");
await irA(APP);
const consola = await evaluar(`JSON.stringify(window.__errores ?? [])`);
console.log(`  errores capturados: ${consola}`);

ws.close();
console.log("\nCapturas en: " + OUT);
process.exit(0);
