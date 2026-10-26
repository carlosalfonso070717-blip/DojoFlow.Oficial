import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cristal, useDesplazamiento } from '@/components/Cristal';
import { Boton, Texto } from '@/components/ui';
import { useTema } from '@/theme';
import { PASOS, type Paso } from './RegistroContexto';

type Props = {
  paso: Paso;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  // Botón fijo al pie
  continuar: { titulo?: string; onPress: () => void; deshabilitado?: boolean; cargando?: boolean };
  // Acción secundaria debajo del botón (p. ej. "Omitir por ahora")
  secundaria?: { titulo: string; onPress: () => void };
  // Contenido fijo arriba del formulario, fuera del scroll (vista previa)
  cabecera?: ReactNode;
  // Sin botón de atrás: después de crear la cuenta ya no se vuelve a los pasos anteriores
  sinAtras?: boolean;
  // Ancho máximo del contenido; los planes usan más para ir en tres columnas
  anchoMaximo?: number;
  // Texto pequeño bajo el botón (p. ej. "Modo de prueba")
  nota?: ReactNode;
};

// Medidas del asistente en una rejilla de 4 pt: margen 24, separación entre bloques 28
const MARGEN = 24;

// Plantilla de cada pantalla del asistente: una pregunta grande, progreso arriba y acción abajo.
// El pie es de cristal y flota: el contenido se desliza por debajo hasta el final.
export function PantallaPaso({ paso, titulo, descripcion, children, continuar, secundaria, cabecera, sinAtras, anchoMaximo = 560, nota }: Props) {
  const { color, radio } = useTema();
  const indice = PASOS.indexOf(paso);
  const progreso = useSharedValue(indice / PASOS.length);
  const [altoPie, setAltoPie] = useState(120);
  const { y, props: desplazamiento } = useDesplazamiento();

  useEffect(() => {
    progreso.value = withTiming((indice + 1) / PASOS.length, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [indice, progreso]);

  const barra = useAnimatedStyle(() => ({ width: `${progreso.value * 100}%` }));
  // El filo de la barra superior aparece cuando el contenido empieza a pasar por debajo
  const filo = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, y.value / 16)) }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['top', 'bottom']}>
      <View style={[estilos.barraSuperior, { paddingHorizontal: MARGEN }]}>
        <View style={[estilos.filaSuperior, { maxWidth: anchoMaximo }]}>
          {/* Sin atrás, la barra de progreso arranca en el mismo borde que el título */}
          {sinAtras ? null : (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Atrás"
              style={({ pressed }) => [estilos.atras, { backgroundColor: color.superficie, borderColor: color.contorno, opacity: pressed ? 0.6 : 1 }]}
            >
              <ChevronLeft size={22} color={color.texto} />
            </Pressable>
          )}
          <View
            style={[estilos.pista, { backgroundColor: color.borde, borderRadius: radio.total }]}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 1, max: PASOS.length, now: indice + 1 }}
          >
            <Animated.View style={[estilos.relleno, { backgroundColor: color.marca, borderRadius: radio.total }, barra]} />
          </View>
          <Texto variante="pequeno" tono="tenue" cifras style={estilos.contador}>
            {indice + 1}/{PASOS.length}
          </Texto>
        </View>
        <Animated.View pointerEvents="none" style={[estilos.filo, { backgroundColor: color.borde }, filo]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.ScrollView
          {...desplazamiento}
          contentContainerStyle={[estilos.contenido, { paddingHorizontal: MARGEN, paddingBottom: altoPie + 24, maxWidth: anchoMaximo + MARGEN * 2 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(380).easing(Easing.out(Easing.cubic))} style={{ gap: 8 }}>
            <Texto variante="titulo" style={{ fontSize: 32, lineHeight: 38 }} accessibilityRole="header">
              {titulo}
            </Texto>
            {descripcion && (
              <Texto variante="cuerpo" tono="suave">
                {descripcion}
              </Texto>
            )}
          </Animated.View>

          {cabecera}

          <Animated.View entering={FadeInDown.delay(90).duration(380).easing(Easing.out(Easing.cubic))} style={{ gap: 16 }}>
            {children}
          </Animated.View>
        </Animated.ScrollView>

        <Cristal style={[estilos.pie, { borderTopColor: color.borde }]}>
          <View onLayout={(e) => setAltoPie(e.nativeEvent.layout.height)} style={[estilos.pieInterior, { paddingHorizontal: MARGEN, maxWidth: Math.min(anchoMaximo, 560) + MARGEN * 2 }]}>
            <Boton
              titulo={continuar.titulo ?? 'Continuar'}
              onPress={continuar.onPress}
              deshabilitado={continuar.deshabilitado}
              cargando={continuar.cargando}
            />
            {secundaria && <Boton titulo={secundaria.titulo} variante="fantasma" tamano="compacto" onPress={secundaria.onPress} />}
            {nota}
          </View>
        </Cristal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  barraSuperior: { paddingTop: 8, paddingBottom: 12, alignItems: 'center' },
  filaSuperior: { width: '100%', minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 16 },
  filo: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
  atras: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  pista: { flex: 1, height: 6, overflow: 'hidden' },
  relleno: { height: '100%' },
  contador: { minWidth: 40, textAlign: 'right' },
  contenido: { gap: 28, paddingTop: 16, width: '100%', alignSelf: 'center' },
  pie: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: StyleSheet.hairlineWidth },
  pieInterior: { gap: 4, paddingTop: 12, paddingBottom: 12, width: '100%', alignSelf: 'center' },
});
