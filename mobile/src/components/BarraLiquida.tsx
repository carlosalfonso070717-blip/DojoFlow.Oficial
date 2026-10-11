import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { asegurarContraste, mezclar } from '@/theme/color';
import { useTema } from '@/theme';
import type { PropsIcono } from './iconos/Iconly';
import { Texto } from './Texto';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Geometría de la barra
const ALTO = 64; // alto de la barra
const HOLGURA = 34; // espacio arriba del SVG para la gota y el ícono que sobresale
const RADIO = 26; // esquinas de la barra
const MEDIA_GOTA = 50; // medio ancho de la gota del borde
const ALTO_GOTA = 22; // cuánto sube el borde sobre la pestaña activa
const BURBUJA = 52;
const MARGEN = 14; // separación de la barra con los lados de la pantalla
const RELLENO = 10; // separación de las pestañas con el borde interno de la barra
const MAX_ANCHO = 480;

// La barra es oscura en ambos modos: la luz del color de la academia luce sobre fondo oscuro
const FONDO_BARRA = '#15161b';

const RESORTE = { damping: 17, stiffness: 190, mass: 0.9 };

// Acepta íconos de Lucide o los de Iconly: ambos reciben size, color y strokeWidth
export type PestanaLiquida = { clave: string; etiqueta: string; icono: ComponentType<PropsIcono> };

type Props = {
  pestanas: PestanaLiquida[];
  activa: number;
  onCambiar: (indice: number) => void;
};

// Espacio que deben dejar abajo las pantallas para que su contenido no quede debajo de la barra
export function useEspacioBarra() {
  const insets = useSafeAreaInsets();
  return ALTO + Math.max(insets.bottom, 12) + 28;
}

// Contorno de la barra con la gota en `cx`: se calcula en el hilo de UI en cada cuadro
function contorno(ancho: number, cx: number, gota: number) {
  'worklet';
  const top = HOLGURA;
  const abajo = HOLGURA + ALTO;
  // Cerca de las esquinas la gota se estrecha para no chocar con la curva
  const izq = Math.max(RADIO + 2, cx - MEDIA_GOTA);
  const der = Math.min(ancho - RADIO - 2, cx + MEDIA_GOTA);
  const cima = top - gota;
  return [
    `M ${RADIO} ${top}`,
    `L ${izq} ${top}`,
    `C ${izq + (cx - izq) * 0.55} ${top} ${cx - (cx - izq) * 0.62} ${cima} ${cx} ${cima}`,
    `C ${cx + (der - cx) * 0.62} ${cima} ${der - (der - cx) * 0.55} ${top} ${der} ${top}`,
    `L ${ancho - RADIO} ${top}`,
    `A ${RADIO} ${RADIO} 0 0 1 ${ancho} ${top + RADIO}`,
    `L ${ancho} ${abajo - RADIO}`,
    `A ${RADIO} ${RADIO} 0 0 1 ${ancho - RADIO} ${abajo}`,
    `L ${RADIO} ${abajo}`,
    `A ${RADIO} ${RADIO} 0 0 1 0 ${abajo - RADIO}`,
    `L 0 ${top + RADIO}`,
    `A ${RADIO} ${RADIO} 0 0 1 ${RADIO} ${top}`,
    'Z',
  ].join(' ');
}

export function BarraLiquida({ pestanas, activa, onCambiar }: Props) {
  const { color, oscuro } = useTema();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const sinMovimiento = useReducedMotion();

  const ancho = Math.min(width - MARGEN * 2, MAX_ANCHO);
  const anchoPestana = (ancho - RELLENO * 2) / pestanas.length;
  const centro = (i: number) => RELLENO + anchoPestana * (i + 0.5);

  const cx = useSharedValue(centro(activa));
  const gota = useSharedValue(ALTO_GOTA);
  const indice = useSharedValue(activa);

  useEffect(() => {
    if (sinMovimiento) {
      cx.value = centro(activa);
      indice.value = activa;
      return;
    }
    cx.value = withSpring(centro(activa), RESORTE);
    indice.value = withSpring(activa, RESORTE);
    // El borde se encoge al soltarse y rebota al llegar: efecto de líquido
    gota.value = withSequence(withTiming(5, { duration: 110 }), withSpring(ALTO_GOTA, { damping: 9, stiffness: 160 }));
    // cx/gota/indice son valores compartidos estables; centro() depende de ancho
  }, [activa, ancho, sinMovimiento]);

  const marca = color.marca;
  const luz = mezclar(marca, '#ffffff', 0.35);
  const textoActivo = asegurarContraste(marca, FONDO_BARRA, 4.5);

  const propsContorno = useAnimatedProps(() => ({ d: contorno(ancho, cx.value, gota.value) }));
  const propsResplandor = useAnimatedProps(() => ({ cx: cx.value }));
  const estiloBurbuja = useAnimatedStyle(() => ({
    transform: [{ translateX: cx.value - BURBUJA / 2 }, { translateY: HOLGURA - gota.value - BURBUJA / 2 + 14 }],
  }));

  const altoTotal = HOLGURA + ALTO;

  return (
    <View
      pointerEvents="box-none"
      style={[estilos.capa, { paddingBottom: Math.max(insets.bottom, 12) }]}
      accessibilityRole="tablist"
    >
      <View style={{ width: ancho, height: altoTotal }}>
        {/* Resplandor amplio detrás de la barra, sigue a la pestaña activa */}
        <Svg width={ancho} height={altoTotal + 40} style={[StyleSheet.absoluteFill, { top: -20, overflow: 'visible' }]} pointerEvents="none">
          <Defs>
            <RadialGradient id="resplandor" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={marca} stopOpacity={oscuro ? 0.55 : 0.32} />
              <Stop offset="0.45" stopColor={marca} stopOpacity={oscuro ? 0.18 : 0.08} />
              <Stop offset="1" stopColor={marca} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <AnimatedCircle animatedProps={propsResplandor} cy={HOLGURA + 20} r={oscuro ? 110 : 80} fill="url(#resplandor)" />
        </Svg>

        {/* La barra con su borde líquido */}
        <Svg width={ancho} height={altoTotal} style={StyleSheet.absoluteFill} pointerEvents="none">
          <AnimatedPath
            animatedProps={propsContorno}
            fill={FONDO_BARRA}
            fillOpacity={1}
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={1}
          />
        </Svg>

        {/* Burbuja brillante detrás del ícono activo */}
        <Animated.View pointerEvents="none" style={[estilos.burbuja, { shadowColor: marca }, estiloBurbuja]}>
          <LinearGradient colors={[luz, marca]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={estilos.relleno} />
        </Animated.View>

        <View style={[estilos.fila, { top: HOLGURA, paddingHorizontal: RELLENO }]}>
          {pestanas.map((p, i) => (
            <Pestana
              key={p.clave}
              pestana={p}
              i={i}
              indice={indice}
              activa={i === activa}
              colorActivo={color.sobreMarca}
              textoActivo={textoActivo}
              onPress={() => {
                if (i !== activa) Haptics.selectionAsync().catch(() => {});
                onCambiar(i);
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

type PropsPestana = {
  pestana: PestanaLiquida;
  i: number;
  indice: SharedValue<number>;
  activa: boolean;
  colorActivo: string;
  textoActivo: string;
  onPress: () => void;
};

function Pestana({ pestana, i, indice, activa, colorActivo, textoActivo, onPress }: PropsPestana) {
  const Icono = pestana.icono;
  // Desde el valor animado del índice: 1 cuando esta pestaña es la activa, 0 cuando no
  const estiloIcono = useAnimatedStyle(() => {
    const cercania = Math.max(0, 1 - Math.abs(indice.value - i));
    return {
      transform: [
        { translateY: interpolate(cercania, [0, 1], [0, -(ALTO / 2 + ALTO_GOTA - 14)]) },
        { scale: interpolate(cercania, [0, 1], [1, 1.08]) },
      ],
    };
  });
  const estiloEtiqueta = useAnimatedStyle(() => {
    const cercania = Math.max(0, 1 - Math.abs(indice.value - i));
    return { opacity: cercania, transform: [{ translateY: interpolate(cercania, [0, 1], [6, 0]) }] };
  });

  // El color del ícono cambia en el render (lucide no anima colores); el movimiento sí es animado
  const [colorIcono, setColorIcono] = useState(activa ? colorActivo : 'rgba(255,255,255,0.55)');
  useEffect(() => setColorIcono(activa ? colorActivo : 'rgba(255,255,255,0.55)'), [activa, colorActivo]);

  return (
    <Pressable
      onPress={onPress}
      style={estilos.pestana}
      accessibilityRole="tab"
      accessibilityState={{ selected: activa }}
      accessibilityLabel={pestana.etiqueta}
      hitSlop={{ top: 12 }}
    >
      <Animated.View style={estiloIcono}>
        <Icono size={24} color={colorIcono} strokeWidth={activa ? 2 : 1.5} />
      </Animated.View>
      <Animated.View style={[estilos.etiqueta, estiloEtiqueta]} pointerEvents="none">
        <Texto variante="pequeno" numberOfLines={1} style={{ color: textoActivo, fontFamily: 'Figtree_700Bold' }}>
          {pestana.etiqueta}
        </Texto>
      </Animated.View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  capa: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  burbuja: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: BURBUJA,
    height: BURBUJA,
    borderRadius: BURBUJA / 2,
    shadowOpacity: 0.85,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  relleno: { flex: 1, borderRadius: BURBUJA / 2 },
  fila: { position: 'absolute', left: 0, right: 0, height: ALTO, flexDirection: 'row' },
  pestana: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  etiqueta: { position: 'absolute', bottom: 9 },
});
