import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import type { DatoBarra } from './GraficaBarras';
import { Texto } from './Texto';

export type ColoresArea = {
  linea: string;
  relleno: string;
  guia: string;
  etiqueta: string;
  etiquetaActiva: string;
  // Globo con la cifra del punto elegido
  globo: string;
  textoGlobo: string;
  textoGloboSuave: string;
};

type Props = {
  datos: DatoBarra[];
  elegido: number;
  onElegir: (indice: number) => void;
  colores: ColoresArea;
  formatoGuia: (n: number) => string;
  formatoGlobo: (n: number) => string;
  // Encabezado del globo del punto elegido (p. ej. "Octubre 2026")
  tituloGlobo: (indice: number) => string;
  mensajeVacio: string;
  alto?: number;
};

// Espacio a la derecha para las cifras de las guías y arriba para el globo
const DERECHA = 44;
const ARRIBA = 14;
const ANCHO_GLOBO = 132;

// Curva suave que pasa por todos los puntos (Catmull-Rom convertida a Bézier cúbica),
// sin pasarse del alto disponible para que el relleno nunca quede por encima del borde
function curva(puntos: { x: number; y: number }[], minY: number, maxY: number) {
  if (puntos.length === 1) return `M ${puntos[0].x} ${puntos[0].y}`;
  const limitar = (y: number) => Math.min(maxY, Math.max(minY, y));
  let d = `M ${puntos[0].x} ${puntos[0].y}`;
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[i - 1] ?? puntos[i];
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    const p3 = puntos[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = limitar(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = limitar(p2.y - (p3.y - p1.y) / 6);
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

// Gráfica de área de una sola serie: el relleno se desvanece hacia abajo con el color de la
// academia y el punto elegido muestra su cifra en un globo. Tocar (o pasar el mouse) elige el mes.
export function GraficaArea({ datos, elegido, onElegir, colores, formatoGuia, formatoGlobo, tituloGlobo, mensajeVacio, alto = 190 }: Props) {
  const [ancho, setAncho] = useState(0);
  const sinDatos = datos.every((d) => d.valor <= 0);
  // La escala arranca cerca del mínimo para que se note la tendencia (si algún mes está en
  // cero, arranca en cero) y deja holgura arriba del máximo para que el globo y el pico respiren
  const valores = datos.map((d) => d.valor);
  const mayor = Math.max(...valores, 1);
  const menor = Math.min(...valores);
  const piso = menor <= 0 || menor === mayor ? 0 : Math.max(0, menor - (mayor - menor) * 0.8);
  const techo = mayor + (mayor - piso) * 0.22;
  const util = Math.max(ancho - DERECHA, 1);
  const base = alto - 2;
  const alturaDe = (v: number) => ARRIBA + (1 - (v - piso) / (techo - piso)) * (base - ARRIBA);

  const puntos = datos.map((d, i) => ({
    x: datos.length > 1 ? (i / (datos.length - 1)) * util : util / 2,
    y: alturaDe(d.valor),
  }));
  const linea = curva(puntos, ARRIBA, base);
  const area = puntos.length ? `${linea} L ${puntos[puntos.length - 1].x} ${base} L ${puntos[0].x} ${base} Z` : '';
  const guias = [0.12, 0.42, 0.72].map((f) => {
    const valor = piso + (techo - piso) * f;
    return { y: alturaDe(valor), valor };
  });

  const punto = puntos[elegido];
  const dato = datos[elegido];
  const izquierdaGlobo = punto ? Math.min(Math.max(punto.x - ANCHO_GLOBO / 2, 0), util - ANCHO_GLOBO + DERECHA) : 0;

  return (
    <View>
      <View style={{ height: alto }} onLayout={(e: LayoutChangeEvent) => setAncho(e.nativeEvent.layout.width)}>
        {ancho > 0 && (
          <Animated.View entering={FadeIn.duration(500)} style={StyleSheet.absoluteFill}>
            <Svg width={ancho} height={alto}>
              <Defs>
                <LinearGradient id="rellenoArea" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colores.relleno} stopOpacity={0.7} />
                  <Stop offset="0.55" stopColor={colores.relleno} stopOpacity={0.28} />
                  <Stop offset="1" stopColor={colores.relleno} stopOpacity={0} />
                </LinearGradient>
              </Defs>

              {guias.map((g) => (
                <Line key={g.y} x1={0} x2={util} y1={g.y} y2={g.y} stroke={colores.guia} strokeWidth={1} strokeDasharray="3 6" />
              ))}

              {!sinDatos && <Path d={area} fill="url(#rellenoArea)" />}
              <Path d={linea} stroke={colores.linea} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />

              {punto && !sinDatos && (
                <>
                  <Line x1={punto.x} x2={punto.x} y1={punto.y} y2={base} stroke={colores.linea} strokeOpacity={0.45} strokeWidth={1} strokeDasharray="3 4" />
                  <Circle cx={punto.x} cy={punto.y} r={11} fill={colores.relleno} fillOpacity={0.25} />
                  <Circle cx={punto.x} cy={punto.y} r={5.5} fill={colores.globo} stroke={colores.relleno} strokeWidth={3} />
                </>
              )}
            </Svg>

            {/* Cifras de las guías, a la derecha */}
            {!sinDatos &&
              guias.map((g) => (
                <Texto key={g.y} variante="pequeno" style={[estilos.cifraGuia, { top: g.y - 8, color: colores.etiqueta }]}>
                  {formatoGuia(g.valor)}
                </Texto>
              ))}

            {punto && dato && !sinDatos && (
              <View pointerEvents="none" style={[estilos.globo, { left: izquierdaGlobo, top: Math.max(punto.y - 62, -10), backgroundColor: colores.globo }]}>
                <Texto variante="pequeno" numberOfLines={1} style={{ color: colores.textoGloboSuave, fontSize: 11 }}>
                  {tituloGlobo(elegido)}
                </Texto>
                <Texto variante="cuerpoFuerte" cifras numberOfLines={1} style={{ color: colores.textoGlobo, fontSize: 15 }}>
                  {formatoGlobo(dato.valor)}
                </Texto>
              </View>
            )}
          </Animated.View>
        )}

        {sinDatos && (
          <View style={estilos.vacio} pointerEvents="none">
            <Texto variante="detalle" style={{ color: colores.etiqueta }}>
              {mensajeVacio}
            </Texto>
          </View>
        )}

        {/* Zonas táctiles: cada mes ocupa su franja vertical completa */}
        <View style={[StyleSheet.absoluteFill, { right: DERECHA, flexDirection: 'row' }]}>
          {datos.map((d, i) => (
            <Pressable
              key={d.clave}
              onPress={() => onElegir(i)}
              onHoverIn={() => onElegir(i)}
              style={{ flex: 1 }}
              accessibilityRole="button"
              accessibilityLabel={d.descripcion}
              accessibilityState={{ selected: i === elegido }}
            />
          ))}
        </View>
      </View>

      <View style={[estilos.etiquetas, { width: util }]}>
        {datos.map((d, i) => {
          // Los extremos se alinean con su borde para no salirse de la tarjeta
          const primero = i === 0 && datos.length > 1;
          const ultimo = i === datos.length - 1 && datos.length > 1;
          const x = puntos[i]?.x ?? 0;
          return (
            <Texto
              key={d.clave}
              variante="pequeno"
              numberOfLines={1}
              style={[
                estilos.etiqueta,
                {
                  left: primero ? 0 : ultimo ? x - 48 : x - 24,
                  textAlign: primero ? 'left' : ultimo ? 'right' : 'center',
                  color: i === elegido ? colores.etiquetaActiva : colores.etiqueta,
                },
                i === elegido && { fontFamily: 'Inter_700Bold' },
              ]}
            >
              {d.etiqueta}
            </Texto>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  cifraGuia: { position: 'absolute', right: 0, fontSize: 11 },
  globo: {
    position: 'absolute',
    width: ANCHO_GLOBO,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    alignItems: 'center',
    boxShadow: '0 12px 30px -10px rgba(0,0,0,0.6)',
  },
  vacio: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  etiquetas: { height: 18, marginTop: 10 },
  etiqueta: { position: 'absolute', width: 48 },
});
