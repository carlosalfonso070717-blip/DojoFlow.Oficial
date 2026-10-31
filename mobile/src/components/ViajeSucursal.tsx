import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';
import type { MarcaAcademia } from '@/api/endpoints';
import { DURACION_VIAJE, useSesion } from '@/auth/session';
import { conAlfa } from '@/theme/color';
import { useTema } from '@/theme';
import { Cristal } from './Cristal';
import { Avatar } from './Elementos';
import { Texto } from './Texto';

// Escena del cambio de sucursal: una personita sale de la casita de la sede actual y camina
// por un sendero de luz hasta la casita de la sede elegida. Todo sobre un cristal que difumina
// la app; al llegar, la casa de destino se enciende con ondas de luz y una palomita.
const ANCHO = 300;
const ALTO_ESCENA = 132;
const CASA = 76; // ancho y alto de cada sede
const RADIO_SEDE = 24;
const LOGO_SEDE = 34;
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
  const { perfil } = useSesion();
  const sinMovimiento = useReducedMotion();
  const { width } = useWindowDimensions();
  // En celulares angostos la escena se encoge para caber con los márgenes de la tarjeta
  const escala = Math.min(1, (width - 32 - 48) / ANCHO);
  const avance = useSharedValue(sinMovimiento ? 1 : 0);
  const zancada = useSharedValue(0);
  const luz = useSharedValue(0);
  const onda = useSharedValue(0);

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
    // Dos ondas de luz salen de la casa de destino
    onda.set(0);
    onda.set(withSequence(withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }), withDelay(60, withTiming(2, { duration: 700, easing: Easing.out(Easing.cubic) }))));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [llego, luz, zancada, onda]);

  const marca = color.marca;
  // Las sedes llevan el logo del negocio: todas sus sucursales comparten la marca
  const academia = perfil?.academia;
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
  // Punta de la estela: un punto de luz que va justo detrás de la personita
  const estiloCometa = useAnimatedStyle(() => ({
    opacity: interpolate(avance.value, [0, 0.05, 0.95, 1], [0, 1, 1, 0]),
    transform: [{ translateX: interpolate(avance.value, [0, 1], [INICIO, FIN]) - 4 }],
  }));
  // Ondas de luz: cada vuelta de 0 a 1 crece y se desvanece
  const estiloOnda = useAnimatedStyle(() => {
    const t = onda.value % 1 || (onda.value > 0 ? 1 : 0);
    return { opacity: interpolate(t, [0, 0.15, 1], [0, 0.7, 0]), transform: [{ scale: interpolate(t, [0, 1], [0.5, 1.9]) }] };
  });
  // La casita de destino se ilumina al llegar
  const estiloLuz = useAnimatedStyle(() => ({
    opacity: interpolate(luz.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(luz.value, [0, 1], [0.6, 1]) }],
  }));
  const estiloEncendida = useAnimatedStyle(() => ({ opacity: interpolate(luz.value, [0, 1], [0, 1], Extrapolation.CLAMP) }));

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(320)}
      style={[StyleSheet.absoluteFill, estilos.capa]}
      accessibilityViewIsModal
      accessibilityLiveRegion="polite"
      accessibilityLabel={llego ? `Ya estás en ${hacia}` : `Cambiando de ${desde} a ${hacia}`}
    >
      {/* La app sigue ahí, difuminada detrás de un cristal, con un resplandor de la marca al centro */}
      <Cristal intensidad={70} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: conAlfa(color.fondo, oscuro ? 0.45 : 0.35) }]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, estilos.centro]}>
        <Svg width={720} height={720}>
          <Defs>
            <RadialGradient id="ambiente-sucursal" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={marca} stopOpacity={oscuro ? 0.28 : 0.16} />
              <Stop offset="1" stopColor={marca} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={360} cy={360} r={360} fill="url(#ambiente-sucursal)" />
        </Svg>
      </View>

      <Animated.View
        entering={ZoomIn.duration(380).easing(Easing.out(Easing.back(1.4)))}
        exiting={ZoomOut.duration(260)}
        style={[
          estilos.tarjeta,
          {
            backgroundColor: color.superficie,
            borderColor: color.contorno,
            borderTopColor: color.contornoLuz,
            boxShadow: `0 40px 90px -30px rgba(0,0,0,${oscuro ? 0.85 : 0.35}), 0 0 90px -40px ${color.brillo}`,
          },
        ]}
      >
        {/* Cristal de la tarjeta */}
        <LinearGradient pointerEvents="none" colors={color.vidrio} style={[StyleSheet.absoluteFill, { borderRadius: 31 }]} />
        <View style={[estilos.etiqueta, { backgroundColor: color.marcaSuave }]}>
          <View style={[estilos.puntoVivo, { backgroundColor: llego ? color.exito : marca }]} />
          <Texto variante="pequeno" style={[estilos.mayusculas, { color: color.marcaTexto }]}>
            {llego ? 'Sucursal lista' : 'Cambiando de sucursal'}
          </Texto>
        </View>

        <View style={{ width: ANCHO * escala, height: ALTO_ESCENA * escala }}>
          <View style={{ width: ANCHO, height: ALTO_ESCENA, transform: [{ scale: escala }], transformOrigin: 'top left' }}>
            {/* Sendero punteado y su rastro de color */}
            <Svg width={ANCHO} height={ALTO_ESCENA} style={StyleSheet.absoluteFill}>
              <Line
                x1={INICIO}
                y1={SUELO}
                x2={FIN}
                y2={SUELO}
                stroke={color.borde}
                strokeWidth={2}
                strokeDasharray="1 8"
                strokeLinecap="round"
              />
            </Svg>
            {/* Estela de luz: se enciende de transparente a la marca, con su punta brillante */}
            <Animated.View style={[estilos.rastro, { left: INICIO, top: SUELO - 1.5 }, estiloRastro]}>
              <LinearGradient colors={[conAlfa(marca, 0), marca]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[estilos.cometa, { top: SUELO - 4, backgroundColor: '#ffffff', boxShadow: `0 0 10px 3px ${marca}, 0 0 22px 6px ${color.brillo}` }, estiloCometa]}
            />
  
            {/* Sede de origen */}
            <View style={[estilos.sede, { left: 0 }]}>
              <Sede academia={academia} />
            </View>

            {/* Sede de destino: idéntica a la de origen; al llegar se enciende encima, sin cambiar de tamaño */}
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
            <Animated.View pointerEvents="none" style={[estilos.onda, { borderColor: marca }, estiloOnda]} />
            <View style={[estilos.sede, { right: 0 }]}>
              <Sede academia={academia} />
              <Animated.View style={[StyleSheet.absoluteFill, estiloEncendida]} pointerEvents="none">
                <Sede academia={academia} encendida />
              </Animated.View>
            </View>
            {llego && (
              <Animated.View
                entering={ZoomIn.springify().damping(11).stiffness(220)}
                style={[estilos.palomita, { backgroundColor: color.exito, borderColor: color.superficie }]}
              >
                <Check size={14} color="#ffffff" strokeWidth={3.2} />
              </Animated.View>
            )}
  
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

        <Animated.View key={llego ? 'llego' : 'yendo'} entering={FadeInDown.duration(280)} style={{ alignItems: 'center', gap: 4 }}>
          <Texto variante="encabezado" style={{ textAlign: 'center', fontSize: 20, lineHeight: 26 }} numberOfLines={2}>
            {llego ? `Ya estás en ${hacia}` : `Yendo a ${hacia}`}
          </Texto>
          <Texto variante="detalle" tono="suave" style={{ textAlign: 'center' }}>
            {llego ? 'Tus alumnos, cobros e inventario ya son de esta sede.' : 'Preparando sus alumnos, cobros e inventario…'}
          </Texto>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

// Sede: un mosaico de cristal como ícono de app, con el logo del negocio al centro y una puerta
// en arco al pie, por donde entra y sale la personita. Apagada es cristal; encendida, el color de
// la marca con luz cálida en la puerta. Las dos sedes de la escena usan exactamente este dibujo.
function Sede({ academia, encendida }: { academia?: MarcaAcademia; encendida?: boolean }) {
  const { color, oscuro } = useTema();
  const fondo: [string, string] = encendida ? [color.degradadoMarca[0], color.degradadoMarca[2]] : [color.vidrio[0], color.superficie];
  return (
    <View
      style={[
        estilos.mosaico,
        {
          borderColor: encendida ? conAlfa(color.marca, 0.9) : color.contorno,
          borderTopColor: encendida ? 'rgba(255,255,255,0.45)' : color.contornoLuz,
          boxShadow: encendida ? `0 14px 34px -10px ${color.brillo}` : `0 14px 30px -14px rgba(0,0,0,${oscuro ? 0.8 : 0.25})`,
        },
      ]}
    >
      <LinearGradient colors={fondo} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: RADIO_SEDE - 1 }]} />
      {/* Reflejo de cristal en la mitad de arriba */}
      <LinearGradient
        pointerEvents="none"
        colors={[encendida ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']}
        locations={[0, 0.55]}
        style={[StyleSheet.absoluteFill, { borderRadius: RADIO_SEDE - 1 }]}
      />
      <View style={[estilos.marcoLogo, { borderColor: encendida ? 'rgba(255,255,255,0.6)' : color.bordeFuerte }]}>
        <Avatar nombre={academia?.nombre ?? 'Sede'} logoUrl={academia?.logoUrl} tamano={LOGO_SEDE} />
      </View>
      {/* Puerta en arco: se ilumina al llegar */}
      <View
        style={[
          estilos.puerta,
          encendida
            ? { backgroundColor: '#fff6e8', boxShadow: '0 0 14px 4px rgba(255,214,150,0.65)' }
            : { backgroundColor: oscuro ? 'rgba(0,0,0,0.55)' : 'rgba(16,18,24,0.18)' },
        ]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  capa: { zIndex: 1000, alignItems: 'center', justifyContent: 'center', padding: 16 },
  centro: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tarjeta: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
    width: 380,
  },
  etiqueta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  puntoVivo: { width: 7, height: 7, borderRadius: 4 },
  mayusculas: { letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'Inter_600SemiBold' },
  cometa: { position: 'absolute', left: 0, width: 8, height: 8, borderRadius: 4 },
  onda: { position: 'absolute', left: FIN - 40, top: SUELO - CASA / 2 - 40, width: 80, height: 80, borderRadius: RADIO_SEDE + 6, borderWidth: 2 },
  palomita: {
    position: 'absolute',
    left: FIN + CASA / 2 - 16,
    top: SUELO - CASA - 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sede: { position: 'absolute', top: SUELO - CASA, width: CASA, height: CASA },
  mosaico: {
    width: CASA,
    height: CASA,
    borderRadius: RADIO_SEDE,
    borderWidth: 1,
    alignItems: 'center',
    paddingTop: 11,
  },
  marcoLogo: { borderWidth: 1.5, borderRadius: LOGO_SEDE, padding: 2 },
  puerta: { position: 'absolute', bottom: 0, left: CASA / 2 - 9, width: 18, height: 19, borderTopLeftRadius: 9, borderTopRightRadius: 9 },
  resplandor: { position: 'absolute', left: FIN - RESPLANDOR / 2, top: SUELO - CASA / 2 - RESPLANDOR / 2, width: RESPLANDOR, height: RESPLANDOR },
  rastro: { position: 'absolute', height: 3, borderRadius: 2, overflow: 'hidden' },
  // Caja de 24 x 52 que termina justo sobre el sendero
  persona: { position: 'absolute', left: 0, top: SUELO - 52, width: 24, height: 52 },
  cabeza: { position: 'absolute', left: 5.5, top: 0, width: 13, height: 13, borderRadius: 6.5 },
  torso: { position: 'absolute', left: 9, top: 14, width: 6, height: 19, borderRadius: 3 },
  brazo: { position: 'absolute', left: 9.75, top: 16, width: 4.5, height: 15, borderRadius: 2.25, transformOrigin: 'top' },
  pierna: { position: 'absolute', left: 9.5, top: 31, width: 5, height: 21, borderRadius: 2.5, transformOrigin: 'top' },
  nombres: { flexDirection: 'row', justifyContent: 'space-between', gap: 24, marginTop: -6 },
  nombre: { flex: 1 },
});
