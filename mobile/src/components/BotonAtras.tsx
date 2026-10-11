import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { useTema } from '@/theme';

// Botón redondo para regresar; si no hay a dónde volver, va a `alterno`
export function BotonAtras({ alterno = '/login' }: { alterno?: '/login' | '/' }) {
  const { color } = useTema();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace(alterno))}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Atrás"
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: color.superficie, borderColor: color.borde, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <ChevronLeft size={22} color={color.texto} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
