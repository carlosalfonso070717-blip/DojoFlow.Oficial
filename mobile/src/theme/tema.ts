import { asegurarContraste, conAlfa, hexAHsl, hslAHex, mezclar, textoSobre } from './color';

export type Esquema = 'light' | 'dark';

export type Marca = {
  primario: string;
  secundario: string;
};

// Identidad de GestAcademy (logo, splash). La app sin academia (login, registro) usa el tema neutro.
export const MARCA_DOJOFLOW: Marca = { primario: '#d90429', secundario: '#14161a' };

// Neutro: tinta sobre gris frío. Se usa cuando todavía no hay academia que dé color
const NEUTRO_CLARO: Marca = { primario: '#151619', secundario: '#151619' };
const NEUTRO_OSCURO: Marca = { primario: '#f2f2f3', secundario: '#1b1c20' };

// Inter es lo más cercano a SF Pro (la letra de Apple) que se puede incluir en la app
export const fuentes = {
  display: 'Inter_700Bold',
  displayMedia: 'Inter_600SemiBold',
  cuerpo: 'Inter_400Regular',
  cuerpoMedia: 'Inter_500Medium',
  cuerpoFuerte: 'Inter_600SemiBold',
  cuerpoNegrita: 'Inter_700Bold',
} as const;

// Escala al estilo iOS (pt): títulos grandes y compactos con tracking negativo que se abre
// conforme baja el tamaño; el texto secundario va en peso regular y lo jerarquiza el color
export const tipografia = {
  gigante: { fontFamily: fuentes.display, fontSize: 44, lineHeight: 48, letterSpacing: -1.3 },
  titulo: { fontFamily: fuentes.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.9 },
  encabezado: { fontFamily: fuentes.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.5 },
  subtitulo: { fontFamily: fuentes.cuerpoFuerte, fontSize: 17, lineHeight: 22, letterSpacing: -0.35 },
  cuerpo: { fontFamily: fuentes.cuerpo, fontSize: 16, lineHeight: 22, letterSpacing: -0.25 },
  cuerpoFuerte: { fontFamily: fuentes.cuerpoFuerte, fontSize: 16, lineHeight: 22, letterSpacing: -0.25 },
  detalle: { fontFamily: fuentes.cuerpo, fontSize: 14, lineHeight: 19, letterSpacing: -0.12 },
  pequeno: { fontFamily: fuentes.cuerpoMedia, fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  cifra: { fontFamily: fuentes.display, fontSize: 34, lineHeight: 40, letterSpacing: -1.1 },
} as const;

export const espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

// Radios con jerarquía: lo más grande contiene, lo más pequeño se toca
export const radio = { s: 8, m: 12, l: 16, xl: 22, total: 999 } as const;

// `marca` null = tema neutro (sin academia)
export function crearTema(marcaAcademia: Marca | null, esquema: Esquema) {
  const oscuro = esquema === 'dark';
  const esNeutro = marcaAcademia === null;
  const marca = marcaAcademia ?? (oscuro ? NEUTRO_OSCURO : NEUTRO_CLARO);
  // Los neutros llevan un toque del tono de la marca: cada academia se siente propia sin ruido.
  // En el tema neutro el tinte es mínimo y frío.
  const h = esNeutro ? 225 : hexAHsl(marca.primario).h;
  const tinte = esNeutro ? 0.35 : 1;
  const neutro = (s: number, l: number) => hslAHex({ h, s: s * tinte, l });

  // Gris agrupado de iOS (#f2f2f7) con un toque mínimo del tono de la marca.
  // En oscuro: negro profundo teñido de la marca (casi carbón cálido con naranja), donde
  // las tarjetas de cristal y el brillo del color de la academia resaltan
  const fondo = oscuro ? neutro(0.3, 0.032) : neutro(0.1, 0.958);
  const superficie = oscuro ? neutro(0.2, 0.075) : '#ffffff';
  const superficieElevada = oscuro ? neutro(0.18, 0.11) : '#ffffff';
  const texto = oscuro ? neutro(0.12, 0.95) : neutro(0.18, 0.11);

  // El relleno de botones debe distinguirse del fondo aunque la academia elija blanco o negro
  const relleno = asegurarContraste(asegurarContraste(marca.primario, superficie, 1.6), fondo, 1.6);

  const exitoBase = '#1f9d6b';
  const avisoBase = '#c98a0b';
  const peligroBase = '#d1344f';

  const color = {
    fondo,
    superficie,
    superficieElevada,
    borde: oscuro ? neutro(0.14, 0.15) : neutro(0.1, 0.9),
    bordeFuerte: oscuro ? neutro(0.12, 0.24) : neutro(0.1, 0.8),
    // Silueta de tarjetas y grupos: en claro casi invisible (la sombra hace el trabajo), en oscuro un filo fino
    contorno: oscuro ? neutro(0.14, 0.135) : 'rgba(16,18,24,0.05)',
    texto,
    textoSuave: oscuro ? neutro(0.1, 0.7) : neutro(0.08, 0.4),
    textoTenue: oscuro ? neutro(0.08, 0.5) : neutro(0.06, 0.58),

    // Cristal de las tarjetas: un degradado vertical apenas perceptible y un filo de luz arriba
    vidrio: (oscuro ? [neutro(0.2, 0.105), neutro(0.22, 0.065)] : ['#ffffff', '#ffffff']) as [string, string],
    // Filo superior de las tarjetas: atrapa la luz como el canto de un cristal
    contornoLuz: oscuro ? neutro(0.16, 0.2) : 'rgba(16,18,24,0.05)',
    sombra: oscuro
      ? '0 1px 0 rgba(255,255,255,0.02), 0 24px 48px -24px rgba(0,0,0,0.9)'
      : '0 0.5px 1px rgba(16,18,24,0.05), 0 4px 18px -8px rgba(16,18,24,0.10)',

    // Marca: el color tal cual para rellenos, y una versión legible para textos e íconos
    marca: relleno,
    marcaPresionada: mezclar(relleno, oscuro ? '#ffffff' : '#000000', 0.15),
    sobreMarca: textoSobre(relleno),
    marcaTexto: asegurarContraste(marca.primario, superficie),
    marcaSuave: conAlfa(marca.primario, esNeutro ? (oscuro ? 0.1 : 0.06) : oscuro ? 0.2 : 0.1),
    // Relleno de los elementos protagonistas: el color de la marca con volumen (claro arriba, profundo abajo)
    // (en el tema neutro, blanco o tinta, apenas se nota para no ensuciarlo de gris)
    degradadoMarca: [mezclar(relleno, '#ffffff', esNeutro ? 0.06 : 0.22), relleno, mezclar(relleno, '#000000', esNeutro ? 0.05 : 0.2)] as [string, string, string],
    // Halo del color de la marca para botones y elementos activos (sin brillo en el tema neutro)
    brillo: esNeutro ? 'rgba(0,0,0,0)' : conAlfa(relleno, oscuro ? 0.6 : 0.4),
    // Luz ambiental que tiñe el fondo de las pantallas principales
    ambiente: [conAlfa(marca.primario, esNeutro ? 0 : oscuro ? 0.26 : 0.12), conAlfa(marca.primario, 0)] as [string, string],

    secundario: marca.secundario,
    sobreSecundario: textoSobre(marca.secundario),

    exito: asegurarContraste(exitoBase, superficie),
    exitoSuave: conAlfa(exitoBase, oscuro ? 0.22 : 0.12),
    aviso: asegurarContraste(avisoBase, superficie),
    avisoSuave: conAlfa(avisoBase, oscuro ? 0.22 : 0.14),
    peligro: asegurarContraste(peligroBase, superficie),
    peligroSuave: conAlfa(peligroBase, oscuro ? 0.22 : 0.1),

    velo: oscuro ? 'rgba(0,0,0,0.6)' : 'rgba(10,12,16,0.4)',
  };

  return { esquema, oscuro, esNeutro, color, fuentes, tipografia, espacio, radio };
}

export type Tema = ReturnType<typeof crearTema>;
