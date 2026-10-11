import { hslAHex } from '@/theme/color';

// ===== Paleta amplia, agrupada por familia =====
export type Familia = { nombre: string; colores: string[] };

export const FAMILIAS: Familia[] = [
  { nombre: 'Rojos', colores: ['#d90429', '#b71c1c', '#e53935', '#ef5350', '#8b0000', '#c62828', '#7b1e2b'] },
  { nombre: 'Naranjas', colores: ['#e85d04', '#f48c06', '#ff7043', '#f4a261', '#e76f51', '#c2410c', '#ff9f68'] },
  { nombre: 'Amarillos y dorados', colores: ['#f4a100', '#ffb703', '#e9c46a', '#d4a017', '#b8860b', '#c9a227', '#f2cc8f'] },
  { nombre: 'Verdes', colores: ['#2e7d32', '#43a047', '#1b5e20', '#2a9d8f', '#00897b', '#6a994e', '#3a5a40', '#52b788'] },
  { nombre: 'Azules', colores: ['#0288d1', '#1565c0', '#0d47a1', '#1e88e5', '#4361ee', '#0077b6', '#023e8a', '#5fa8d3'] },
  { nombre: 'Morados', colores: ['#8e44ad', '#6a1b9a', '#7b2cbf', '#9d4edd', '#5a189a', '#3949ab', '#b185db'] },
  { nombre: 'Rosas', colores: ['#c2185b', '#e91e63', '#f06292', '#ff4d8d', '#d6336c', '#b5179e', '#e5989b'] },
  { nombre: 'Tierra', colores: ['#6d4c41', '#8d6e63', '#a0522d', '#7f5539', '#bc6c25', '#99582a', '#5c4033'] },
  { nombre: 'Neutros y metálicos', colores: ['#37474f', '#455a64', '#263238', '#14161a', '#6c757d', '#9ea7ad', '#c0c4c8', '#b08d57'] },
];

// ===== Búsqueda por descripción ("naranja suave con plateado") =====
type Base = { h: number; s: number; l: number };

// Colores base en HSL (tono 0-360, saturación y luz 0-1)
const BASES: Record<string, Base> = {
  rojo: { h: 354, s: 0.85, l: 0.45 },
  carmesi: { h: 348, s: 0.83, l: 0.47 },
  vino: { h: 345, s: 0.6, l: 0.28 },
  guinda: { h: 345, s: 0.6, l: 0.3 },
  coral: { h: 12, s: 0.8, l: 0.62 },
  salmon: { h: 10, s: 0.75, l: 0.7 },
  naranja: { h: 25, s: 0.9, l: 0.52 },
  mandarina: { h: 28, s: 0.95, l: 0.55 },
  durazno: { h: 25, s: 0.85, l: 0.75 },
  ambar: { h: 40, s: 0.95, l: 0.5 },
  amarillo: { h: 48, s: 0.95, l: 0.52 },
  mostaza: { h: 44, s: 0.7, l: 0.45 },
  dorado: { h: 43, s: 0.65, l: 0.5 },
  oro: { h: 43, s: 0.65, l: 0.5 },
  crema: { h: 40, s: 0.6, l: 0.88 },
  beige: { h: 35, s: 0.35, l: 0.8 },
  verde: { h: 130, s: 0.55, l: 0.38 },
  esmeralda: { h: 150, s: 0.65, l: 0.38 },
  oliva: { h: 80, s: 0.35, l: 0.38 },
  menta: { h: 155, s: 0.5, l: 0.65 },
  lima: { h: 85, s: 0.7, l: 0.5 },
  bosque: { h: 140, s: 0.45, l: 0.25 },
  turquesa: { h: 175, s: 0.65, l: 0.42 },
  aqua: { h: 180, s: 0.6, l: 0.5 },
  cian: { h: 190, s: 0.8, l: 0.45 },
  azul: { h: 215, s: 0.75, l: 0.45 },
  celeste: { h: 200, s: 0.75, l: 0.65 },
  cielo: { h: 200, s: 0.75, l: 0.65 },
  marino: { h: 222, s: 0.65, l: 0.22 },
  rey: { h: 225, s: 0.75, l: 0.45 },
  cobalto: { h: 220, s: 0.8, l: 0.4 },
  indigo: { h: 235, s: 0.55, l: 0.38 },
  morado: { h: 280, s: 0.55, l: 0.42 },
  violeta: { h: 270, s: 0.6, l: 0.5 },
  purpura: { h: 290, s: 0.55, l: 0.38 },
  lila: { h: 275, s: 0.45, l: 0.72 },
  lavanda: { h: 260, s: 0.5, l: 0.78 },
  rosa: { h: 335, s: 0.75, l: 0.6 },
  fucsia: { h: 320, s: 0.85, l: 0.5 },
  magenta: { h: 310, s: 0.8, l: 0.48 },
  cafe: { h: 22, s: 0.4, l: 0.32 },
  marron: { h: 20, s: 0.45, l: 0.3 },
  chocolate: { h: 20, s: 0.5, l: 0.25 },
  terracota: { h: 15, s: 0.55, l: 0.45 },
  arena: { h: 38, s: 0.4, l: 0.7 },
  gris: { h: 210, s: 0.06, l: 0.5 },
  grafito: { h: 215, s: 0.1, l: 0.25 },
  carbon: { h: 220, s: 0.1, l: 0.12 },
  negro: { h: 220, s: 0.08, l: 0.09 },
  blanco: { h: 40, s: 0.15, l: 0.97 },
  plateado: { h: 210, s: 0.08, l: 0.76 },
  plata: { h: 210, s: 0.08, l: 0.76 },
  bronce: { h: 30, s: 0.5, l: 0.42 },
  cobre: { h: 22, s: 0.6, l: 0.45 },
  champan: { h: 40, s: 0.45, l: 0.8 },
};

// Modificadores: cómo cambian saturación (ds) y luz (dl), o fijan valores
type Modificador = { ds?: number; dl?: number; s?: number; l?: number };

const MODIFICADORES: Record<string, Modificador> = {
  suave: { ds: -0.25, dl: 0.14 },
  pastel: { s: 0.55, l: 0.8 },
  claro: { dl: 0.18 },
  clarito: { dl: 0.22 },
  palido: { ds: -0.3, dl: 0.22 },
  oscuro: { dl: -0.18 },
  profundo: { dl: -0.2, ds: 0.05 },
  intenso: { ds: 0.2, dl: -0.04 },
  vivo: { ds: 0.25 },
  brillante: { ds: 0.25, dl: 0.05 },
  electrico: { s: 1, l: 0.5 },
  neon: { s: 1, l: 0.55 },
  apagado: { ds: -0.35 },
  tenue: { ds: -0.3, dl: 0.08 },
  elegante: { ds: -0.2, dl: -0.12 },
  sobrio: { ds: -0.3, dl: -0.08 },
  metalico: { ds: -0.15, dl: 0.05 },
  calido: { ds: 0.05 },
  frio: { ds: -0.1 },
};

const sinAcentos = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// Acepta formas comunes: "naranjas", "rosado", "azulado", "verdoso", "dorados"
function raiz(palabra: string): string | null {
  if (BASES[palabra]) return palabra;
  const variantes = [
    palabra.replace(/(es|s)$/, ''),
    palabra.replace(/(ado|ada|ados|adas)$/, ''),
    palabra.replace(/(oso|osa)$/, 'e'),
    palabra.replace(/(oso|osa)$/, ''),
  ];
  return variantes.find((v) => BASES[v]) ?? null;
}

const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

function aplicar(base: Base, mods: Modificador[]): Base {
  return mods.reduce<Base>(
    (c, m) => ({
      h: c.h,
      s: limitar(m.s ?? c.s + (m.ds ?? 0)),
      l: limitar(m.l ?? c.l + (m.dl ?? 0), 0.06, 0.97),
    }),
    base,
  );
}

type Parte = { nombre: string; color: Base };

// Divide "naranja suave con plateado" en partes: [naranja suave] y [plateado]
function interpretar(descripcion: string): Parte[] {
  const palabras = sinAcentos(descripcion).split(/[^a-z]+/).filter(Boolean);
  const partes: { base: string; mods: Modificador[] }[] = [];
  let pendientes: Modificador[] = [];
  // Solo "con", "y" o "fondo" introducen un segundo color; "azul marino" o "verde menta" son uno solo
  let separado = false;

  for (const palabra of palabras) {
    if (['con', 'y', 'fondo'].includes(palabra)) {
      separado = true;
      continue;
    }
    if (['o', 'de', 'el', 'la', 'un', 'una', 'mas', 'muy', 'color', 'tono'].includes(palabra)) continue;
    if (MODIFICADORES[palabra]) {
      // "suave" se aplica al último color nombrado; si aún no hay, al siguiente
      if (partes.length) partes[partes.length - 1].mods.push(MODIFICADORES[palabra]);
      else pendientes.push(MODIFICADORES[palabra]);
      continue;
    }
    const base = raiz(palabra);
    if (!base) continue;
    if (partes.length && !separado) {
      // Mismo color, más específico: el segundo nombre manda
      partes[partes.length - 1].base = base;
      partes[partes.length - 1].mods.push(...pendientes);
    } else {
      partes.push({ base, mods: pendientes });
    }
    pendientes = [];
    separado = false;
  }

  return partes.map((p) => ({ nombre: p.base, color: aplicar(BASES[p.base], p.mods) }));
}

export type Sugerencia = { primario: string; secundario: string; etiqueta: string };

// Variaciones alrededor de un color para ofrecer opciones cercanas a lo pedido
function variaciones(c: Base): string[] {
  const ajustes: [number, number, number][] = [
    [0, 0, 0],
    [0, 0, -0.08],
    [0, 0, 0.08],
    [-8, 0.05, 0],
    [8, -0.05, 0],
    [0, -0.12, 0.04],
  ];
  return ajustes.map(([dh, ds, dl]) => hslAHex({ h: (c.h + dh + 360) % 360, s: limitar(c.s + ds), l: limitar(c.l + dl, 0.06, 0.95) }));
}

// Devuelve combinaciones de color principal y fondo de credencial según la descripción
export function buscarColores(descripcion: string): Sugerencia[] {
  const partes = interpretar(descripcion);
  if (partes.length === 0) return [];

  const [principal, segundo] = partes;
  // Sin segundo color: fondo carbón y un tono profundo del mismo color
  const fondos = segundo
    ? variaciones(segundo.color).slice(0, 3)
    : [hslAHex({ h: 220, s: 0.08, l: 0.09 }), hslAHex({ h: principal.color.h, s: limitar(principal.color.s * 0.6), l: 0.16 })];

  const principales = variaciones(principal.color);
  const sugerencias: Sugerencia[] = [];
  principales.forEach((p, i) => {
    sugerencias.push({ primario: p, secundario: fondos[i % fondos.length], etiqueta: segundo ? `${principal.nombre} con ${segundo.nombre}` : principal.nombre });
  });
  return sugerencias;
}
