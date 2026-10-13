// Verifica la altura real de cada imagen de tarjeta en el navegador.
const targets = await (await fetch("http://localhost:9222/json")).json();
const target = targets.find((t) => t.type === "page");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pend = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result.value;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://localhost:3000" });
for (let i = 0; i < 40; i++) { if (await ev(`document.querySelectorAll('.offer-card').length > 0`)) break; await dormir(500); }
await dormir(2500);

console.log("=== Alturas reales de cada tarjeta (viewport normal, sin captureBeyondViewport) ===");
console.log(await ev(`
  JSON.stringify([...document.querySelectorAll('.offer-card')].map((c, i) => {
    const box = c.querySelector('.card-image');
    const img = c.querySelector('.card-image img');
    const cs = getComputedStyle(box);
    return {
      i: i + 1,
      nombre: (c.querySelector('h3')?.textContent || '').slice(0, 28),
      cajaH: Math.round(box.getBoundingClientRect().height),
      cajaCssH: cs.height,
      imgH: img ? Math.round(img.getBoundingClientRect().height) : null,
      imgNatural: img ? img.naturalWidth + 'x' + img.naturalHeight : 'sin img',
      imgComplete: img ? img.complete : null
    };
  }), null, 2)
`));

console.log("\n=== Captura con viewport normal (sin captureBeyondViewport) ===");
const { data } = await send("Page.captureScreenshot", {
  format: "png",
  clip: { x: 0, y: 480, width: 1440, height: 640, scale: 1 },
});
const { writeFileSync } = await import("node:fs");
writeFileSync("C:/Users/jejim/AppData/Local/Temp/opencode/shots/04-alturas-reales.png", Buffer.from(data, "base64"));
console.log("  -> shots/04-alturas-reales.png");

console.log("\n=== CSS computado de .card-image ===");
console.log(await ev(`
  (() => {
    const box = document.querySelector('.card-image');
    const cs = getComputedStyle(box);
    const img = box.querySelector('img');
    const ics = img ? getComputedStyle(img) : null;
    return JSON.stringify({
      caja: { height: cs.height, display: cs.display, overflow: cs.overflow },
      img: ics ? { height: ics.height, width: ics.width, objectFit: ics.objectFit, display: ics.display } : null
    }, null, 2);
  })()
`));

ws.close();
process.exit(0);
