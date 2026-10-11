import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { conAlfa } from '@/theme/color';
import { useTema } from '@/theme';
import { formatoCorto, formatoMoneda } from './ui';
import { Insignia } from './Elementos';
import { Tarjeta } from './Tarjetas';
import { Texto } from './Texto';

export type MesGrafica = { clave: string; corto: string; largo: string; valor: number };

const ALTO_BARRAS = 132;

// Ingresos de los últimos meses en barras de un solo tono: el mes elegido va en el color
// de la academia y los demás atenuados. Tocar (o pasar el mouse) sobre un mes muestra su cifra.
export function GraficaIngresos({ meses }: { meses: MesGrafica[] }) {
  const { color } = useTema();
  const [elegido, setElegido] = useState(meses.length - 1);
  const progreso = useSharedValue(0);

  useEffect(() => {
    progreso.value = 0;
    progreso.value = withDelay(120, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
  }, [meses, progreso]);

  if (meses.length === 0) return null;
  const sinIngresos = meses.every((m) => m.valor <= 0);
  const maximo = Math.max(...meses.map((m) => m.valor), 1);
  const mes = meses[Math.min(elegido, meses.length - 1)];
  const anterior = meses[Math.min(elegido, meses.length - 1) - 1];
  const cambio = anterior && anterior.valor > 0 ? ((mes.valor - anterior.valor) / anterior.valor) * 100 : null;

  return (
    <Tarjeta style={{ gap: 18 }}>
      <View style={estilos.cabecera}>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="subtitulo">Últimos {meses.length} meses</Texto>
          <Texto variante="detalle" tono="suave" cifras numberOfLines={1}>
            {mes.largo}: <Texto variante="detalle" cifras style={{ fontFamily: 'Figtree_700Bold' }}>{formatoMoneda(mes.valor)}</Texto>
            {elegido === meses.length - 1 ? ' · en curso' : ''}
          </Texto>
        </View>
        {cambio !== null && (
          <Insignia
            tono={cambio >= 0 ? 'exito' : 'peligro'}
            icono={cambio >= 0 ? TrendingUp : TrendingDown}
            texto={`${cambio >= 0 ? '+' : ''}${Math.round(cambio)}% vs ${anterior.corto}`}
          />
        )}
      </View>

      <View style={{ marginTop: 14 }}>
        {/* Guías recesivas: la mitad y el máximo, con su cifra */}
        <View style={[estilos.guia, { top: 0, borderColor: color.borde }]}>
          {!sinIngresos && (
            <Texto variante="pequeno" tono="tenue" style={estilos.textoGuia}>
              {formatoCorto(maximo)}
            </Texto>
          )}
        </View>
        <View style={[estilos.guia, { top: ALTO_BARRAS / 2, borderColor: color.borde }]} />
        {sinIngresos && (
          <View style={estilos.vacio} pointerEvents="none">
            <Texto variante="detalle" tono="tenue" style={{ backgroundColor: color.superficie, paddingHorizontal: 10 }}>
              Aquí verás cómo crecen tus cobros y ventas
            </Texto>
          </View>
        )}

        <View style={[estilos.barras, { borderBottomColor: color.bordeFuerte }]}>
          {meses.map((m, i) => (
            <Barra
              key={m.clave}
              mes={m}
              alto={(m.valor / maximo) * (ALTO_BARRAS - 18)}
              activa={i === elegido}
              progreso={progreso}
              onElegir={() => setElegido(i)}
            />
          ))}
        </View>
        <View style={estilos.etiquetas}>
          {meses.map((m, i) => (
            <Texto
              key={m.clave}
              variante="pequeno"
              tono={i === elegido ? 'normal' : 'tenue'}
              style={[estilos.etiqueta, i === elegido && { fontFamily: 'Figtree_700Bold' }]}
            >
              {m.corto}
            </Texto>
          ))}
        </View>
      </View>
    </Tarjeta>
  );
}

function Barra({ mes, alto, activa, progreso, onElegir }: { mes: MesGrafica; alto: number; activa: boolean; progreso: SharedValue<number>; onElegir: () => void }) {
  const { color } = useTema();
  // Un mes sin ingresos se ve como un trazo mínimo sobre la línea base, no como un hueco
  const final = mes.valor > 0 ? Math.max(alto, 6) : 2;
  const estilo = useAnimatedStyle(() => ({ height: final * progreso.value }));
  return (
    <Pressable
      onPress={onElegir}
      onHoverIn={onElegir}
      style={estilos.columna}
      accessibilityRole="button"
      accessibilityLabel={`${mes.largo}: ${formatoMoneda(mes.valor)}`}
      accessibilityState={{ selected: activa }}
    >
      <Animated.View
        style={[
          estilos.barra,
          { backgroundColor: mes.valor > 0 ? (activa ? color.marca : conAlfa(color.marca, 0.3)) : color.bordeFuerte },
          estilo,
        ]}
      />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  guia: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed' },
  // La cifra va encima de la guía: nunca choca con la barra más alta
  textoGuia: { position: 'absolute', right: 0, top: -18, fontSize: 11 },
  barras: { height: ALTO_BARRAS, flexDirection: 'row', alignItems: 'flex-end', gap: 2, borderBottomWidth: 1 },
  // Toda la columna recibe el toque, no solo la barra
  columna: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  barra: { width: '58%', maxWidth: 34, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  etiquetas: { flexDirection: 'row', gap: 2, marginTop: 8 },
  vacio: { position: 'absolute', left: 0, right: 0, top: 0, height: ALTO_BARRAS, alignItems: 'center', justifyContent: 'center' },
  etiqueta: { flex: 1, textAlign: 'center' },
});
