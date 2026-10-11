// Utilidades de color para derivar un tema completo a partir del color de cada academia

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

export function hexARgb(hex: string): Rgb {
  const limpio = hex.replace('#', '');
  const valor = parseInt(limpio.length === 3 ? limpio.replace(/./g, (c) => c + c) : limpio, 16);
  return { r: (valor >> 16) & 255, g: (valor >> 8) & 255, b: valor & 255 };
}

export function rgbAHex({ r, g, b }: Rgb): string {
  const canal = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${canal(r)}${canal(g)}${canal(b)}`;
}

export function hexAHsl(hex: string): Hsl {
  const { r, g, b } = hexARgb(hex);
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}

export function hslAHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbAHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 });
}

// Mezcla a con b; peso = cuánto de b
export function mezclar(a: string, b: string, peso: number): string {
  const ca = hexARgb(a);
  const cb = hexARgb(b);
  return rgbAHex({
    r: ca.r + (cb.r - ca.r) * peso,
    g: ca.g + (cb.g - ca.g) * peso,
    b: ca.b + (cb.b - ca.b) * peso,
  });
}

export function conAlfa(hex: string, alfa: number): string {
  return `${hex}${Math.round(alfa * 255).toString(16).padStart(2, '0')}`;
}

// Luminancia relativa y contraste según WCAG 2.1
export function luminancia(hex: string): number {
  const { r, g, b } = hexARgb(hex);
  const lineal = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
}

export function contraste(a: string, b: string): number {
  const [la, lb] = [luminancia(a), luminancia(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Texto blanco o casi negro, el que se lea mejor sobre el fondo dado
export function textoSobre(fondo: string, oscuro = '#14161a'): string {
  return contraste('#ffffff', fondo) >= contraste(oscuro, fondo) ? '#ffffff' : oscuro;
}

// Aclara u oscurece un color hasta que tenga el contraste mínimo contra el fondo
// (p. ej. un azul marino de marca usado como texto en modo oscuro)
export function asegurarContraste(color: string, fondo: string, minimo = 4.5): string {
  if (contraste(color, fondo) >= minimo) return color;
  const haciaBlanco = luminancia(fondo) < 0.5;
  const destino = haciaBlanco ? '#ffffff' : '#000000';
  for (let paso = 0.05; paso <= 1; paso += 0.05) {
    const candidato = mezclar(color, destino, paso);
    if (contraste(candidato, fondo) >= minimo) return candidato;
  }
  return destino;
}
