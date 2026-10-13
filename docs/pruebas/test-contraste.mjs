// Verificacion WCAG de la paleta "Sostenibilidad Caribena".
// Calcula la ratio de contraste real de cada par texto/fondo.

const pares = [
  // [descripcion, primer plano, fondo, nivel requerido]
  ["Texto principal sobre superficie",      "#0f172a", "#ffffff", "AA texto"],
  ["Texto principal sobre fondo",           "#0f172a", "#f8fafc", "AA texto"],
  ["Texto secundario sobre superficie",     "#475569", "#ffffff", "AA texto"],
  ["Texto secundario sobre fondo",          "#475569", "#f8fafc", "AA texto"],
  ["Primario como texto sobre blanco",      "#006699", "#ffffff", "AA texto"],
  ["Primario como etiqueta (eyebrow)",      "#006699", "#f8fafc", "AA texto"],
  ["Secundario como texto",                 "#15803d", "#ffffff", "AA texto"],
  ["Boton primario: blanco sobre azul",     "#ffffff", "#006699", "AA texto"],
  ["Boton primario hover",                  "#ffffff", "#004d73", "AA texto"],
  ["Ocupacion baja",                        "#15803d", "#ffffff", "AA texto"],
  ["Ocupacion media",                       "#b45309", "#ffffff", "AA texto"],
  ["Ocupacion alta",                        "#b91c1c", "#ffffff", "AA texto"],
  ["Mensaje de exito",                      "#15803d", "#f0fdf4", "AA texto"],
  ["Mensaje de error",                      "#b91c1c", "#fef2f2", "AA texto"],
  ["Mensaje de aviso",                      "#b45309", "#fffbeb", "AA texto"],
  ["Badge ADMIN",                           "#3730a3", "#e0e7ff", "AA texto"],
  ["Badge GESTOR",                          "#92400e", "#fef3c7", "AA texto"],
  ["Badge OPERADOR",                        "#075985", "#e0f2fe", "AA texto"],
  ["Badge TURISTA",                         "#065f46", "#d1fae5", "AA texto"],
  ["Borde sobre superficie (no texto)",     "#e2e8f0", "#ffffff", "3:1 UI"],
  ["Franja de sesion (texto)",              "#0f172a", "#e6eff6", "AA texto"],
];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

function lin(c) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminancia(hex) {
  const [r, g, b] = hexToRgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

console.log("=".repeat(72));
console.log("VERIFICACION DE CONTRASTE — WCAG 2.1");
console.log("=".repeat(72));
console.log("\nPar evaluado                                  Ratio   Minimo   Veredicto");
console.log("-".repeat(72));

let fallos = 0;
for (const [desc, fg, bg, nivel] of pares) {
  const r = ratio(fg, bg);
  const minimo = nivel === "3:1 UI" ? 3 : 4.5;
  const ok = r >= minimo;
  if (!ok) fallos++;
  const marca = ok ? "PASA" : "FALLA";
  console.log(
    `${desc.padEnd(44)} ${r.toFixed(2).padStart(5)}:1  ${String(minimo).padStart(4)}:1   ${marca}`,
  );
}

console.log("\n" + "-".repeat(72));
console.log(`Resultado: ${pares.length - fallos}/${pares.length} pares cumplen`);

console.log("\nNota sobre el ambar:");
console.log(`  #d97706 (amber-600) sobre blanco = ${ratio("#d97706", "#ffffff").toFixed(2)}:1  NO cumple 4.5:1`);
console.log(`  #b45309 (amber-700) sobre blanco = ${ratio("#b45309", "#ffffff").toFixed(2)}:1  SI cumple`);
console.log("  Por eso --accent-gold queda solo para superficies grandes y bordes,");
console.log("  y todo texto ambar usa --accent-gold-deep / --warn.");

console.log("\nNota sobre el texto secundario:");
console.log(`  slate-500 #64748b = ${ratio("#64748b", "#ffffff").toFixed(2)}:1 (justo, el diseno usa 11-12px)`);
console.log(`  slate-600 #475569 = ${ratio("#475569", "#ffffff").toFixed(2)}:1 (holgado, adopted)`);

process.exit(fallos === 0 ? 0 : 1);
