import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { useTema } from '@/theme';
import { Rejilla, Tarjeta, useSombra, Vidrio } from './Tarjetas';

// Estados de carga: la pantalla se dibuja con su misma estructura (tarjetas, filas, gráficas)
// pero con bloques que brillan en lugar de datos. Así nada brinca cuando llegan los datos.

const CICLO = 1400;

type PropsBloque = { ancho?: DimensionValue; alto?: number; radio?: number; style?: StyleProp<ViewStyle> };

// Pieza básica: un bloque tenue con un destello que lo cruza de izquierda a derecha
export function Bloque({ ancho = '100%', alto = 14, radio = 6, style }: PropsBloque) {
  const { oscuro } = useTema();
  const reducir = useReducedMotion();
  const [anchoReal, setAnchoReal] = useState(0);
  const t = useSharedValue(0);

  useEffect(() => {
    if (reducir) return;
    t.value = withRepeat(withTiming(1, { duration: CICLO, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [t, reducir]);

  const destello = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [0, 1], [-anchoReal, anchoReal]) }],
  }));

  return (
    <View
      onLayout={(e) => setAnchoReal(e.nativeEvent.layout.width)}
      style={[
        { width: ancho, height: alto, borderRadius: radio, overflow: 'hidden', backgroundColor: oscuro ? 'rgba(255,255,255,0.065)' : 'rgba(16,18,24,0.07)' },
        style,
      ]}
    >
      {anchoReal > 0 && !reducir && (
        <Animated.View style={[StyleSheet.absoluteFill, destello]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', oscuro ? 'rgba(255,255,255,0.085)' : 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

// Solo se muestra si de verdad hay espera: si los datos llegan antes de esto, el esqueleto nunca se ve
const ESPERA_VISIBLE = 300;

// Contenedor de cualquier estado de carga: aparece con un fundido solo si la espera se alarga,
// se desvanece al llegar los datos (desde la opacidad que tenga: si nunca se vio, sale sin verse)
// y se anuncia a los lectores de pantalla
export function Cargando({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const opacidad = useSharedValue(0);
  useEffect(() => {
    opacidad.value = withDelay(ESPERA_VISIBLE, withTiming(1, { duration: 220 }));
  }, [opacidad]);
  const visible = useAnimatedStyle(() => ({ opacity: opacidad.value }));

  const salida = () => {
    'worklet';
    return {
      initialValues: { opacity: opacidad.value },
      animations: { opacity: withTiming(0, { duration: 180 }) },
    };
  };

  return (
    <Animated.View exiting={salida} style={[style, visible]} accessible accessibilityLabel="Cargando" accessibilityRole="progressbar">
      {children}
    </Animated.View>
  );
}

// Igual que <Indicador>: ícono, cifra y etiqueta
export function EsqueletoIndicador() {
  return (
    <Tarjeta style={estilos.indicador}>
      <Bloque ancho={38} alto={38} radio={12} />
      <View style={{ gap: 8 }}>
        <Bloque ancho="55%" alto={24} radio={8} />
        <Bloque ancho="70%" alto={12} />
      </View>
    </Tarjeta>
  );
}

export function EsqueletoIndicadores({ columnas, cantidad = columnas }: { columnas: number; cantidad?: number }) {
  return (
    <Rejilla columnas={columnas}>
      {Array.from({ length: cantidad }, (_, i) => (
        <EsqueletoIndicador key={i} />
      ))}
    </Rejilla>
  );
}

// Igual que <ResumenMovil>: tarjetitas que se deslizan de lado
export function EsqueletoResumenMovil({ sangria, cantidad = 3 }: { sangria: number; cantidad?: number }) {
  const { color, radio } = useTema();
  const sombra = useSombra();
  return (
    <ScrollView
      horizontal
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -sangria }}
      contentContainerStyle={{ paddingHorizontal: sangria, gap: 10 }}
    >
      {Array.from({ length: cantidad }, (_, i) => (
        <View
          key={i}
          style={[
            estilos.resumen,
            { backgroundColor: color.superficie, borderColor: color.contorno, borderTopColor: color.contornoLuz, borderRadius: radio.l + 2 },
            sombra,
          ]}
        >
          <Vidrio radio={radio.l + 1} />
          <Bloque ancho={64} alto={10} />
          <Bloque ancho={84} alto={20} radio={6} />
        </View>
      ))}
    </ScrollView>
  );
}

// Igual que <Buscador>: mismo material y alto, con la lupa y el texto de ayuda en bloques
export function EsqueletoBuscador() {
  const { color, radio, oscuro } = useTema();
  return (
    <View
      style={[
        estilos.buscador,
        oscuro
          ? { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: color.contorno, borderWidth: StyleSheet.hairlineWidth, borderRadius: radio.l }
          : { backgroundColor: 'rgba(118,118,128,0.12)', borderRadius: radio.m },
      ]}
    >
      <Bloque ancho={18} alto={18} radio={9} />
      <Bloque ancho="35%" alto={12} />
    </View>
  );
}

// Igual que <Fila>: avatar o ícono, título, detalle y algo a la derecha
export function EsqueletoFila({ avatar = true, derecha = false, cuadrado = false }: { avatar?: boolean; derecha?: boolean; cuadrado?: boolean }) {
  return (
    <View style={estilos.fila}>
      {avatar && <Bloque ancho={cuadrado ? 40 : 44} alto={cuadrado ? 40 : 44} radio={cuadrado ? 12 : 22} />}
      <View style={{ flex: 1, gap: 8 }}>
        <Bloque ancho="55%" alto={14} />
        <Bloque ancho="38%" alto={11} />
      </View>
      {derecha && (
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <Bloque ancho={72} alto={14} />
          <Bloque ancho={56} alto={18} radio={9} />
        </View>
      )}
    </View>
  );
}

// Igual que una lista de <CeldaLista>: tarjetas sueltas en el celular, rejilla en escritorio
export function EsqueletoLista({
  filas = 6,
  columnas = 1,
  avatar,
  derecha,
  cuadrado,
}: {
  filas?: number;
  columnas?: number;
  avatar?: boolean;
  derecha?: boolean;
  cuadrado?: boolean;
}) {
  const { color, radio } = useTema();
  const sombra = useSombra();
  const celdas = Array.from({ length: filas }, (_, i) => (
    <View
      key={i}
      style={[
        estilos.celda,
        { backgroundColor: color.superficie, borderColor: color.contorno, borderTopColor: color.contornoLuz, borderRadius: columnas > 1 ? radio.l : radio.l + 2 },
        sombra,
      ]}
    >
      <Vidrio radio={(columnas > 1 ? radio.l : radio.l + 2) - 1} />
      <EsqueletoFila avatar={avatar} derecha={derecha} cuadrado={cuadrado} />
    </View>
  ));
  if (columnas > 1) {
    return (
      <Rejilla columnas={columnas} espacio={14}>
        {celdas}
      </Rejilla>
    );
  }
  return <View style={{ gap: 10 }}>{celdas}</View>;
}

// Igual que las tarjetas de producto: foto arriba y nombre, precio y existencia debajo.
// `proporcion` es la de la foto (16/10 en escritorio, 4/3 en el celular)
export function EsqueletoProductos({ cantidad = 6, columnas, proporcion }: { cantidad?: number; columnas: number; proporcion: number }) {
  const { color, radio } = useTema();
  const sombra = useSombra();
  return (
    <Rejilla columnas={columnas} espacio={columnas > 2 ? 14 : 12}>
      {Array.from({ length: cantidad }, (_, i) => (
        <View
          key={i}
          style={[
            estilos.producto,
            { backgroundColor: color.superficie, borderColor: color.contorno, borderTopColor: color.contornoLuz, borderRadius: radio.l + 2 },
            sombra,
          ]}
        >
          <Vidrio radio={radio.l + 1} />
          <View style={{ aspectRatio: proporcion }}>
            <Bloque alto={0} radio={radio.m} style={{ height: '100%' }} />
          </View>
          <View style={{ gap: 8, paddingHorizontal: 4 }}>
            <Bloque ancho="70%" alto={14} />
            <Bloque ancho="45%" alto={11} />
          </View>
        </View>
      ))}
    </Rejilla>
  );
}

// Igual que <Grupo>: filas dentro de una misma superficie, separadas por líneas finas
export function EsqueletoGrupo({ filas = 3, titulo, avatar = true }: { filas?: number; titulo?: boolean; avatar?: boolean }) {
  const { color, radio } = useTema();
  const sombra = useSombra();
  return (
    <View style={{ gap: 8 }}>
      {titulo && <Bloque ancho={96} alto={11} style={{ marginLeft: 16 }} />}
      <View style={[estilos.grupo, { backgroundColor: color.superficie, borderColor: color.contorno, borderTopColor: color.contornoLuz, borderRadius: radio.l }, sombra]}>
        <Vidrio radio={radio.l - 1} />
        {Array.from({ length: filas }, (_, i) => (
          <View key={i}>
            {i > 0 && <View style={[estilos.separador, { backgroundColor: color.borde, marginLeft: avatar ? 72 : 16 }]} />}
            <EsqueletoFila avatar={avatar} cuadrado />
          </View>
        ))}
      </View>
    </View>
  );
}

// Igual que la tarjeta de ingresos de Inicio: encabezado, cifra grande, gráfica y leyenda
export function EsqueletoGrafica({ alto = 190 }: { alto?: number }) {
  return (
    <Tarjeta style={{ padding: 22, gap: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 10 }}>
          <Bloque ancho="40%" alto={12} />
          <Bloque ancho="62%" alto={40} radio={10} />
        </View>
        <Bloque ancho={180} alto={34} radio={17} style={{ maxWidth: '40%' }} />
      </View>
      <Bloque alto={alto} radio={14} />
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flex: 1, gap: 8 }}>
            <Bloque ancho="60%" alto={10} />
            <Bloque ancho="80%" alto={18} />
          </View>
        ))}
      </View>
    </Tarjeta>
  );
}

const estilos = StyleSheet.create({
  indicador: { gap: 14, padding: 16, flex: 1 },
  resumen: { minWidth: 128, paddingHorizontal: 14, paddingVertical: 14, gap: 10, borderWidth: StyleSheet.hairlineWidth },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56 },
  buscador: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 44 },
  celda: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  grupo: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  producto: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', padding: 10, paddingBottom: 14, gap: 12 },
  separador: { height: StyleSheet.hairlineWidth },
});
