import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
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
};

// Plantilla de cada pantalla del asistente: una pregunta grande, progreso arriba y acción abajo
export function PantallaPaso({ paso, titulo, descripcion, children, continuar, secundaria, cabecera }: Props) {
  const { color, espacio, radio } = useTema();
  const indice = PASOS.indexOf(paso);
  const progreso = useSharedValue(indice / PASOS.length);

  useEffect(() => {
    progreso.value = withTiming((indice + 1) / PASOS.length, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [indice, progreso]);

  const barra = useAnimatedStyle(() => ({ width: `${progreso.value * 100}%` }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['top', 'bottom']}>
      <View style={[estilos.barraSuperior, { paddingHorizontal: espacio.l }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Atrás"
          style={[estilos.atras, { backgroundColor: color.superficie, borderColor: color.borde }]}
        >
          <ChevronLeft size={22} color={color.texto} />
        </Pressable>
        <View
          style={[estilos.pista, { backgroundColor: color.borde, borderRadius: radio.total }]}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: PASOS.length, now: indice + 1 }}
        >
          <Animated.View style={[estilos.relleno, { backgroundColor: color.marca, borderRadius: radio.total }, barra]} />
        </View>
        <Texto variante="pequeno" tono="tenue" cifras style={{ minWidth: 32, textAlign: 'right' }}>
          {indice + 1}/{PASOS.length}
        </Texto>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[estilos.contenido, { paddingHorizontal: espacio.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(380).easing(Easing.out(Easing.cubic))} style={{ gap: 10 }}>
            <Texto variante="titulo" style={{ fontSize: 32, lineHeight: 37 }} accessibilityRole="header">
              {titulo}
            </Texto>
            {descripcion && (
              <Texto variante="cuerpo" tono="suave">
                {descripcion}
              </Texto>
            )}
          </Animated.View>

          {cabecera}

          <Animated.View entering={FadeInDown.delay(90).duration(380).easing(Easing.out(Easing.cubic))} style={{ gap: 14 }}>
            {children}
          </Animated.View>
        </ScrollView>

        <View style={[estilos.pie, { paddingHorizontal: espacio.xl, borderTopColor: color.borde, backgroundColor: color.fondo }]}>
          <Boton
            titulo={continuar.titulo ?? 'Continuar'}
            onPress={continuar.onPress}
            deshabilitado={continuar.deshabilitado}
            cargando={continuar.cargando}
          />
          {secundaria && (
            <Boton titulo={secundaria.titulo} variante="fantasma" tamano="compacto" onPress={secundaria.onPress} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  barraSuperior: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 8, paddingBottom: 12 },
  atras: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  pista: { flex: 1, height: 6, overflow: 'hidden' },
  relleno: { height: '100%' },
  contenido: { gap: 28, paddingTop: 20, paddingBottom: 32, maxWidth: 560, width: '100%', alignSelf: 'center' },
  pie: { gap: 4, paddingTop: 12, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
});
