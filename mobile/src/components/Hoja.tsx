import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiseno } from '@/hooks/useDiseno';
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
  const { esEscritorio } = useDiseno();
  const [montado, setMontado] = useState(visible);
  const progreso = useSharedValue(0);

  // Se monta en cuanto se pide abrir; se desmonta al terminar la animación de cierre
  if (visible && !montado) setMontado(true);

  useEffect(() => {
    if (visible) {
      progreso.value = withTiming(1, { duration: DURACION, easing: Easing.out(Easing.cubic) });
    } else if (montado) {
      progreso.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, (terminado) => {
        if (terminado) runOnJS(setMontado)(false);
      });
    }
  }, [visible, montado, progreso]);

  const velo = useAnimatedStyle(() => ({ opacity: progreso.value }));
  // Celular: sube desde abajo. Escritorio: diálogo centrado que aparece con un leve acercamiento.
  const panel = useAnimatedStyle(() =>
    esEscritorio
      ? { opacity: progreso.value, transform: [{ translateY: (1 - progreso.value) * 16 }, { scale: 0.97 + progreso.value * 0.03 }] }
      : { transform: [{ translateY: (1 - progreso.value) * 400 }] },
  );

  return (
    <Modal visible={montado} transparent animationType="none" onRequestClose={onCerrar} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color.velo }, velo]}>
          <Pressable style={{ flex: 1 }} onPress={onCerrar} accessibilityLabel="Cerrar" />
        </Animated.View>

        {/* El panel se centra con ancho máximo: en tableta no ocupa toda la pantalla */}
        <View style={[estilos.ancla, esEscritorio && estilos.anclaCentro]} pointerEvents="box-none">
          <Animated.View
            style={[
              estilos.panel,
              esEscritorio
                ? [estilos.dialogo, { backgroundColor: color.superficieElevada, borderRadius: radio.xl }]
                : {
                    backgroundColor: color.superficieElevada,
                    borderTopLeftRadius: radio.xl,
                    borderTopRightRadius: radio.xl,
                    paddingBottom: Math.max(insets.bottom, 16),
                  },
              panel,
            ]}
          >
            {!esEscritorio && <View style={[estilos.asa, { backgroundColor: color.bordeFuerte }]} />}
            <View style={{ gap: 6, marginBottom: 20 }}>
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  ancla: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, justifyContent: 'flex-end', alignItems: 'center' },
  panel: { width: '100%', maxWidth: 600, paddingHorizontal: 24, paddingTop: 10, maxHeight: '90%' },
  anclaCentro: { justifyContent: 'center', padding: 32 },
  dialogo: { maxWidth: 560, paddingTop: 28, paddingBottom: 24, maxHeight: '100%', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 40, shadowOffset: { width: 0, height: 16 } },
  asa: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
  acciones: { flexDirection: 'row', gap: 10, marginTop: 24 },
});
