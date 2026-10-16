import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { Texto } from './Texto';

export type DatoBarra = { clave: string; etiqueta: string; valor: number; descripcion: string };

export type ColoresGrafica = {
  activo: string;
  inactivo: string;
  vacio: string;
  guia: string;
  base: string;
  etiqueta: string;
  etiquetaActiva: string;
  // Fondo detrás del mensaje de "sin datos", para que la guía no lo cruce
  fondo: string;
};

type Props = {
  datos: DatoBarra[];
  elegido: number;
  onElegir: (indice: number) => void;
  colores: ColoresGrafica;
  formatoGuia: (n: number) => string;
  mensajeVacio: string;
  alto?: number;
  // Con muchas barras solo se rotula una de cada N (más la elegida)
  cadaEtiqueta?: number;
};

// Barras de una sola serie: la elegida resaltada, las demás atenuadas. Tocar (o pasar el
// mouse) sobre una barra la elige. Sin leyenda: el título de la tarjeta nombra la serie.
export function GraficaBarras({ datos, elegido, onElegir, colores, formatoGuia, mensajeVacio, alto = 132, cadaEtiqueta = 1 }: Props) {
  const progreso = useSharedValue(0);
  const firma = datos.map((d) => `${d.clave}:${d.valor}`).join('|');

  useEffect(() => {
    progreso.value = 0;
    progreso.value = withDelay(120, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
  }, [firma, progreso]);

  const sinDatos = datos.every((d) => d.valor <= 0);
  const maximo = Math.max(...datos.map((d) => d.valor), 1);
  const separacion = datos.length > 12 ? 2 : 4;

  return (
    <View style={{ marginTop: 14 }}>
      {/* Guías recesivas: el máximo (con su cifra, encima de la línea) y la mitad */}
      <View style={[estilos.guia, { top: 0, borderColor: colores.guia }]}>
        {!sinDatos && (
          <Texto variante="pequeno" style={[estilos.textoGuia, { color: colores.etiqueta }]}>
            {formatoGuia(maximo)}
          </Texto>
        )}
      </View>
      <View style={[estilos.guia, { top: alto / 2, borderColor: colores.guia }]} />
      {sinDatos && (
        <View style={[estilos.vacio, { height: alto }]} pointerEvents="none">
          <Texto variante="detalle" style={{ color: colores.etiqueta, backgroundColor: colores.fondo, paddingHorizontal: 10 }}>
            {mensajeVacio}
          </Texto>
        </View>
      )}

      <View style={[estilos.barras, { height: alto, gap: separacion, borderBottomColor: colores.base }]}>
        {datos.map((d, i) => (
          <Barra
            key={d.clave}
            dato={d}
            alto={(d.valor / maximo) * (alto - 18)}
            activa={i === elegido}
            colores={colores}
            progreso={progreso}
            onElegir={() => onElegir(i)}
          />
        ))}
      </View>
      <View style={[estilos.etiquetas, { gap: separacion }]}>
        {datos.map((d, i) => {
          const visible = i === elegido || i % cadaEtiqueta === 0;
          return (
            <Texto
              key={d.clave}
              variante="pequeno"
              numberOfLines={1}
              style={[
                estilos.etiqueta,
                { color: i === elegido ? colores.etiquetaActiva : colores.etiqueta, opacity: visible ? 1 : 0 },
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

function Barra({
  dato,
  alto,
  activa,
  colores,
  progreso,
  onElegir,
}: {
  dato: DatoBarra;
  alto: number;
  activa: boolean;
  colores: ColoresGrafica;
  progreso: SharedValue<number>;
  onElegir: () => void;
}) {
  // Sin valor se ve como un trazo mínimo sobre la línea base, no como un hueco
  const final = dato.valor > 0 ? Math.max(alto, 6) : 2;
  const estilo = useAnimatedStyle(() => ({ height: final * progreso.value }));
  return (
    <Pressable
      onPress={onElegir}
      onHoverIn={onElegir}
      style={estilos.columna}
      accessibilityRole="button"
      accessibilityLabel={dato.descripcion}
      accessibilityState={{ selected: activa }}
    >
      <Animated.View
        style={[estilos.barra, { backgroundColor: dato.valor > 0 ? (activa ? colores.activo : colores.inactivo) : colores.vacio }, estilo]}
      />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  guia: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed' },
  // La cifra va encima de la guía: nunca choca con la barra más alta
  textoGuia: { position: 'absolute', right: 0, top: -18, fontSize: 11 },
  vacio: { position: 'absolute', left: 0, right: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
  barras: { flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 1 },
  // Toda la columna recibe el toque, no solo la barra
  columna: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  barra: { width: '62%', maxWidth: 34, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  etiquetas: { flexDirection: 'row', marginTop: 8 },
  etiqueta: { flex: 1, textAlign: 'center' },
});
