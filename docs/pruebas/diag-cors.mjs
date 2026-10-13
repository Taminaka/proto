// Diagnostico: por que el catalogo llega vacio en el navegador?
const { webSocketDebuggerUrl } = await (await fetch("http://localhost:9222/json/version")).json();
const targets = await (await fetch("http://localhost:9222/json")).json();
const target = targets.find((t) => t.type === "page");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res) => ws.addEventListener("open", res, { once: true }));

let id = 0;
const pend = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pend.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result.value;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Page.navigate", { url: "http://localhost:3000" });
await dormir(5000);

console.log("=== 1. Estado del React en la pagina ===");
console.log(await ev(`(() => {
  const empties = [...document.querySelectorAll('.empty-state')].map(e => e.textContent.trim());
  const errors = [...document.querySelectorAll('.notice.error')].map(e => e.textContent.trim());
  const cards = document.querySelectorAll('.offer-card').length;
  const tabs = [...document.querySelectorAll('.tab')].map(t => t.textContent.trim());
  const opts = document.querySelectorAll('.filters select option').length;
  return JSON.stringify({ cards, errores: errors, vacios: empties, tabs, opcionesCategoria: opts }, null, 2);
})()`));

console.log("\n=== 2. Fetch directo desde el navegador (sujeto a CORS) ===");
console.log(await ev(`
  (async () => {
    try {
      const r = await fetch("https://proto-api.taminaka.com/api/attractions/public");
      const j = await r.json();
      return JSON.stringify({ status: r.status, items: Array.isArray(j) ? j.length : typeof j });
    } catch (e) {
      return "ERROR: " + e.message;
    }
  })()
`));

console.log("\n=== 3. Cabeceras CORS para este origen ===");
console.log(await ev(`
  (async () => {
    const r = await fetch("https://proto-api.taminaka.com/api/categories/public");
    const h = {};
    r.headers.forEach((v, k) => { if (k.startsWith("access-control")) h[k] = v; });
    return JSON.stringify({ status: r.status, corsHeaders: h });
  })()
`));

console.log("\n=== 4. Configuracion de red de la app ===");
console.log(await ev(`
  (() => {
    const html = document.documentElement.innerHTML;
    const m = html.match(/proto-api[^\"']*/);
    return JSON.stringify({ apiEnHtml: m ? m[0] : "no encontrada", origin: location.origin });
  })()
`));

console.log("\n=== 5. Logs de red de Next (buffers) ===");
console.log(await ev(`JSON.stringify(window.__NEXT_DATA__ ?? "sin __NEXT_DATA__ (es App Router, normal)")`));

ws.close();
process.exit(0);
