import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '@/theme';
import { Boton } from './Boton';
import { Texto } from './Texto';

type Props = {
  visible: boolean;
  titulo: string;
  descripcion?: string;
  onCerrar: () => void;
  // Acción principal fija al pie de la hoja
  accion?: { titulo: string; onPress: () => void; cargando?: boolean; variante?: 'primario' | 'peligro' };
  children?: ReactNode;
};

const DURACION = 260;

// Hoja que sube desde abajo: reemplaza a los SweetAlert con formulario de la web
export function Hoja({ visible, titulo, descripcion, onCerrar, accion, children }: Props) {
  const { color, radio } = useTema();
  const insets = useSafeAreaInsets();
  const [montado, setMontado] = useState(visible);
  const progreso = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMontado(true);
      progreso.value = withTiming(1, { duration: DURACION, easing: Easing.out(Easing.cubic) });
    } else if (montado) {
      progreso.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, (terminado) => {
        if (terminado) runOnJS(setMontado)(false);
      });
    }
  }, [visible, montado, progreso]);

  const velo = useAnimatedStyle(() => ({ opacity: progreso.value }));
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progreso.value) * 400 }] }));

  return (
    <Modal visible={montado} transparent animationType="none" onRequestClose={onCerrar} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color.velo }, velo]}>
          <Pressable style={{ flex: 1 }} onPress={onCerrar} accessibilityLabel="Cerrar" />
        </Animated.View>

        <Animated.View
          style={[
            estilos.panel,
            {
              backgroundColor: color.superficieElevada,
              borderTopLeftRadius: radio.xl,
              borderTopRightRadius: radio.xl,
              paddingBottom: Math.max(insets.bottom, 16),
            },
            panel,
          ]}
        >
          <View style={[estilos.asa, { backgroundColor: color.bordeFuerte }]} />
          <View style={{ gap: 4, marginBottom: 16 }}>
            <Texto variante="encabezado">{titulo}</Texto>
            {descripcion && (
              <Texto variante="detalle" tono="suave">
                {descripcion}
              </Texto>
            )}
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }} style={{ flexGrow: 0 }}>
            {children}
          </ScrollView>

          {accion && (
            <View style={estilos.acciones}>
              <Boton titulo="Cancelar" variante="contorno" onPress={onCerrar} style={{ flex: 1 }} />
              <Boton
                titulo={accion.titulo}
                onPress={accion.onPress}
                cargando={accion.cargando}
                variante={accion.variante ?? 'primario'}
                style={{ flex: 1.4 }}
              />
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 10, maxHeight: '90%' },
  asa: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
  acciones: { flexDirection: 'row', gap: 10, marginTop: 20 },
});
