import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTema } from '@/theme';
import { Texto } from './Texto';

// Monograma de GestAcademy: una D trazada con un flujo que la atraviesa
export function Monograma({ size = 40, tinta, papel }: { size?: number; tinta?: string; papel?: string }) {
  const { color } = useTema();
  const fondo = tinta ?? color.marca;
  const trazo = papel ?? color.sobreMarca;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityLabel="GestAcademy">
      <Rect width={40} height={40} rx={12} fill={fondo} />
      <Path d="M13 11h7.5a9 9 0 0 1 0 18H13z" fill="none" stroke={trazo} strokeWidth={2.8} strokeLinejoin="round" />
      <Path d="M9 22.5c4.5-3.4 9.5 3.4 14 0s7.5-1.8 8.5-.6" fill="none" stroke={trazo} strokeWidth={2.8} strokeLinecap="round" />
    </Svg>
  );
}

export function Marca({ tamano = 'normal' }: { tamano?: 'normal' | 'grande' }) {
  const grande = tamano === 'grande';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: grande ? 14 : 10 }}>
      <Monograma size={grande ? 48 : 34} />
      <Texto variante={grande ? 'titulo' : 'subtitulo'} style={{ fontFamily: 'BricolageGrotesque_700Bold', letterSpacing: -0.4 }}>
        GestAcademy
      </Texto>
    </View>
  );
}
