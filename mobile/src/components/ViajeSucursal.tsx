import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { DURACION_VIAJE, useSesion } from '@/auth/session';
import { conAlfa } from '@/theme/color';
import { useTema } from '@/theme';
import { Texto } from './Texto';

// Escena del cambio de sucursal: una personita sale de la casita de la sede actual
// y camina por un sendero hasta la casita de la sede elegida.
const ANCHO = 300;
const ALTO_ESCENA = 132;
const CASA = 76; // ancho de cada casita
const SUELO = 112; // altura (y) del sendero
const INICIO = CASA / 2; // centro de la puerta izquierda
const FIN = ANCHO - CASA / 2; // centro de la puerta derecha
const RESPLANDOR = 110;
const PASO = 300; // ms de cada zancada

export function ViajeSucursal() {
  const { viaje } = useSesion();
  if (!viaje) return null;
  return <Escena desde={viaje.desde} hacia={viaje.hacia} llego={viaje.llego} />;
}

function Escena({ desde, hacia, llego }: { desde: string; hacia: string; llego: boolean }) {
  const { color, oscuro } = useTema();
  const sinMovimiento = useReducedMotion();
  const { width } = useWindowDimensions();
  // En celulares angostos la escena se encoge para caber con los márgenes de la tarjeta
  const escala = Math.min(1, (width - 32 - 28) / ANCHO);
  const avance = useSharedValue(sinMovimiento ? 1 : 0);
  const zancada = useSharedValue(0);
  const luz = useSharedValue(0);

  useEffect(() => {
    if (sinMovimiento) return;
    // Un respiro antes de salir y otro antes de llegar: el recorrido termina justo al cambiar de sede
    avance.set(withTiming(1, { duration: DURACION_VIAJE - 250, easing: Easing.inOut(Easing.cubic) }));
    zancada.set(withRepeat(withTiming(1, { duration: PASO, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(zancada);
  }, [avance, zancada, sinMovimiento]);

  useEffect(() => {
    if (!llego) return;
    cancelAnimation(zancada);
    zancada.set(withTiming(0.5, { duration: 160 }));
    luz.set(withSpring(1, { damping: 12, stiffness: 140 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [llego, luz, zancada]);

  const marca = color.marca;
  const tinta = color.texto;

  // La personita: avanza, rebota un poco con cada paso y se desvanece al cruzar cada puerta
  const estiloPersona = useAnimatedStyle(() => {
    const x = interpolate(avance.value, [0, 1], [INICIO, FIN]);
    const rebote = interpolate(zancada.value, [0, 0.5, 1], [0, -2.5, 0]);
    const opacidad = interpolate(avance.value, [0, 0.07, 0.93, 1], [0, 1, 1, 0]);
    return { opacity: opacidad, transform: [{ translateX: x - 12 }, { translateY: rebote }] };
  });
  // Piernas y brazos se balancean en contra: cuando una pierna va al frente, su brazo va atrás
  const piernaA = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(zancada.value, [0, 1], [-26, 26])}deg` }] }));
  const piernaB = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(zancada.value, [0, 1], [26, -26])}deg` }] }));
  const brazoA = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(zancada.value, [0, 1], [22, -22])}deg` }] }));
  const brazoB = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(zancada.value, [0, 1], [-22, 22])}deg` }] }));

  // El sendero se va pintando del color de la marca detrás de la personita
  const estiloRastro = useAnimatedStyle(() => ({
    width: interpolate(avance.value, [0, 1], [0, FIN - INICIO]),
  }));
  // La casita de destino se ilumina al llegar
  const estiloLuz = useAnimatedStyle(() => ({
    opacity: interpolate(luz.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(luz.value, [0, 1], [0.6, 1]) }],
  }));
  const estiloDestino = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(luz.value, [0, 0.6, 1], [1, 1.07, 1]) }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(320)}
      style={[StyleSheet.absoluteFill, estilos.capa, { backgroundColor: conAlfa(color.fondo, oscuro ? 0.9 : 0.86) }]}
      accessibilityViewIsModal
      accessibilityLiveRegion="polite"
      accessibilityLabel={llego ? `Ya estás en ${hacia}` : `Cambiando de ${desde} a ${hacia}`}
    >
      <Animated.View
        entering={ZoomIn.duration(320).easing(Easing.out(Easing.cubic))}
        style={[
          estilos.tarjeta,
          {
            backgroundColor: color.superficie,
            borderColor: color.borde,
            shadowColor: oscuro ? '#000' : marca,
          },
        ]}
      >
        <Texto variante="pequeno" tono="tenue" style={estilos.mayusculas}>
          Cambiando de sucursal
        </Texto>

        <View style={{ width: ANCHO * escala, height: ALTO_ESCENA * escala }}>
          <View style={{ width: ANCHO, height: ALTO_ESCENA, transform: [{ scale: escala }], transformOrigin: 'top left' }}>
            {/* Sendero punteado y su rastro de color */}
            <Svg width={ANCHO} height={ALTO_ESCENA} style={StyleSheet.absoluteFill}>
              <Line
                x1={INICIO}
                y1={SUELO}
                x2={FIN}
                y2={SUELO}
                stroke={color.bordeFuerte}
                strokeWidth={2}
                strokeDasharray="2 7"
                strokeLinecap="round"
              />
            </Svg>
            <Animated.View style={[estilos.rastro, { left: INICIO, top: SUELO - 1.5, backgroundColor: marca }, estiloRastro]} />
  
            {/* Casita de origen */}
            <View style={[estilos.casa, { left: 0 }]}>
              <Casa trazo={color.textoTenue} relleno={color.fondo} puerta={color.bordeFuerte} />
            </View>
  
            {/* Casita de destino, con su resplandor */}
            <Animated.View style={[estilos.resplandor, estiloLuz]} pointerEvents="none">
              <Svg width={RESPLANDOR} height={RESPLANDOR}>
                <Defs>
                  <RadialGradient id="luz-sucursal" cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor={marca} stopOpacity={oscuro ? 0.55 : 0.35} />
                    <Stop offset="1" stopColor={marca} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle cx={RESPLANDOR / 2} cy={RESPLANDOR / 2} r={RESPLANDOR / 2} fill="url(#luz-sucursal)" />
              </Svg>
            </Animated.View>
            <Animated.View style={[estilos.casa, { right: 0 }, estiloDestino]}>
              <Casa trazo={marca} relleno={conAlfa(marca, 0.12)} puerta={marca} ventana={llego ? marca : undefined} />
            </Animated.View>
  
            {/* La personita */}
            <Animated.View style={[estilos.persona, estiloPersona]} pointerEvents="none">
              <View style={[estilos.cabeza, { backgroundColor: tinta }]} />
              <Animated.View style={[estilos.brazo, { backgroundColor: conAlfa(tinta, 0.55) }, brazoB]} />
              <Animated.View style={[estilos.pierna, { backgroundColor: conAlfa(tinta, 0.55) }, piernaB]} />
              <View style={[estilos.torso, { backgroundColor: tinta }]} />
              <Animated.View style={[estilos.pierna, { backgroundColor: tinta }, piernaA]} />
              <Animated.View style={[estilos.brazo, { backgroundColor: tinta }, brazoA]} />
            </Animated.View>
          </View>
        </View>

        <View style={[estilos.nombres, { width: ANCHO * escala }]}>
          <Texto variante="detalle" tono="suave" numberOfLines={2} style={[estilos.nombre, { textAlign: 'left' }]}>
            {desde}
          </Texto>
          <Texto variante="detalle" numberOfLines={2} style={[estilos.nombre, { textAlign: 'right', color: color.marcaTexto, fontFamily: 'Inter_700Bold' }]}>
            {hacia}
          </Texto>
        </View>

        <Texto variante="subtitulo" style={{ textAlign: 'center' }}>
          {llego ? `Ya estás en ${hacia}` : `Yendo a ${hacia}…`}
        </Texto>
      </Animated.View>
    </Animated.View>
  );
}

// Casita: techo a dos aguas, puerta al centro y una ventana
function Casa({ trazo, relleno, puerta, ventana }: { trazo: string; relleno: string; puerta: string; ventana?: string }) {
  return (
    <Svg width={CASA} height={SUELO + 1} viewBox={`0 0 ${CASA} ${SUELO + 1}`}>
      {/* Chimenea */}
      <Rect x={50} y={42} width={8} height={16} rx={1.5} fill={relleno} stroke={trazo} strokeWidth={2} />
      {/* Cuerpo y techo */}
      <Path
        d={`M10 64 L38 40 L66 64 L66 ${SUELO} L10 ${SUELO} Z`}
        fill={relleno}
        stroke={trazo}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M4 69 L38 38 L72 69" fill="none" stroke={trazo} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Puerta */}
      <Path d={`M31 ${SUELO} L31 ${SUELO - 22} Q38 ${SUELO - 28} 45 ${SUELO - 22} L45 ${SUELO} Z`} fill={puerta} fillOpacity={0.9} />
      <Circle cx={41.5} cy={SUELO - 10} r={1.4} fill={relleno} />
      {/* Ventana: se enciende en la casa de destino al llegar */}
      <Rect x={50} y={SUELO - 34} width={10} height={10} rx={2} fill={ventana ?? 'none'} stroke={trazo} strokeWidth={1.6} />
    </Svg>
  );
}

const estilos = StyleSheet.create({
  capa: { zIndex: 1000, alignItems: 'center', justifyContent: 'center', padding: 16 },
  tarjeta: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 22,
    paddingBottom: 26,
    paddingHorizontal: 14,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
    shadowOpacity: 0.22,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 16,
  },
  mayusculas: { letterSpacing: 1.2, textTransform: 'uppercase' },
  casa: { position: 'absolute', top: 0, width: CASA },
  resplandor: { position: 'absolute', left: FIN - RESPLANDOR / 2, top: 75 - RESPLANDOR / 2, width: RESPLANDOR, height: RESPLANDOR },
  rastro: { position: 'absolute', height: 3, borderRadius: 2 },
  // Caja de 24 x 52 que termina justo sobre el sendero
  persona: { position: 'absolute', left: 0, top: SUELO - 52, width: 24, height: 52 },
  cabeza: { position: 'absolute', left: 5.5, top: 0, width: 13, height: 13, borderRadius: 6.5 },
  torso: { position: 'absolute', left: 9, top: 14, width: 6, height: 19, borderRadius: 3 },
  brazo: { position: 'absolute', left: 9.75, top: 16, width: 4.5, height: 15, borderRadius: 2.25, transformOrigin: 'top' },
  pierna: { position: 'absolute', left: 9.5, top: 31, width: 5, height: 21, borderRadius: 2.5, transformOrigin: 'top' },
  nombres: { flexDirection: 'row', justifyContent: 'space-between', gap: 24, marginTop: -6 },
  nombre: { flex: 1 },
});
