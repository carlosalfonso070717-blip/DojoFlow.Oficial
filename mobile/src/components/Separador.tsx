import { StyleSheet, View } from 'react-native';
import { useTema } from '@/theme';
import { Texto } from './Texto';

// Línea con una palabra al centro: "o con tu correo"
export function Separador({ texto }: { texto: string }) {
  const { color } = useTema();
  return (
    <View style={estilos.fila} accessibilityRole="none">
      <View style={[estilos.linea, { backgroundColor: color.borde }]} />
      <Texto variante="pequeno" tono="tenue" style={{ letterSpacing: 0.3 }}>
        {texto}
      </Texto>
      <View style={[estilos.linea, { backgroundColor: color.borde }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  linea: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
});
