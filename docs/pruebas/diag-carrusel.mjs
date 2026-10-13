// Verifica que el carrusel del hero rota solo cada 3 segundos
// y que el carrusel del modal responde a las flechas.
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
await dormir(1500);

const activa = `(() => { const a = document.querySelector('.hero-carousel__slide.activa'); return a ? a.getAttribute('src') : 'NINGUNA'; })()`;
const dots = `document.querySelectorAll('.hero-carousel__dot').length`;
const slides = `document.querySelectorAll('.hero-carousel__slide').length`;

console.log("=== Hero: estructura ===");
console.log("  slides renderizadas:", await ev(slides));
console.log("  puntos de control  :", await ev(dots));
console.log("  marco inclinado    :", await ev(`(() => { const f=document.querySelector('.hero-art__frame'); const c=f?getComputedStyle(f):null; return c ? c.transform + ' | inset ' + c.top : 'NO EXISTE'; })()`));

console.log("\n=== Hero: rotacion automatica (muestreo cada 1s) ===");
const muestras = [];
for (let i = 0; i < 11; i++) {
  muestras.push(await ev(activa));
  process.stdout.write(`  t=${i}s -> ${String(muestras[i]).split("/").pop()}\n`);
  await dormir(1000);
}

const cambios = muestras.filter((v, i) => i > 0 && v !== muestras[i - 1]).length;
console.log(`\n  cambios de foto en 10 s: ${cambios}  (esperado ~3 con intervalo de 3 s)`);

console.log("\n=== Modal de detalle ===");
await ev(`(() => {
  const c = document.querySelector('.offer-card');
  if (c) c.click();
  return true;
})()`);
await dormir(2000);
console.log("  carrusel presente :", await ev(`!!document.querySelector('.modal-carousel')`));
console.log("  fotos en el modal :", await ev(`document.querySelectorAll('.modal-carousel__dot').length`));
console.log("  contador          :", await ev(`document.querySelector('.modal-carousel__counter')?.textContent ?? 'n/d'`));
const antes = await ev(`document.querySelector('.modal-carousel__counter')?.textContent`);
await ev(`document.querySelector('.modal-carousel__arrow--next')?.click()`);
await dormir(500);
const despues = await ev(`document.querySelector('.modal-carousel__counter')?.textContent`);
console.log(`  flecha siguiente  : ${antes} -> ${despues}  ${antes !== despues ? "FUNCIONA" : "NO CAMBIA"}`);

ws.close();
process.exit(0);
