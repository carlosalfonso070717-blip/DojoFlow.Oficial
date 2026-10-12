import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTema } from '@/theme';
import { Texto } from './Texto';

// Monograma de GestAcademy: una G abierta con un punto que la corona (el alumno)
export function Monograma({ size = 40, tinta, papel }: { size?: number; tinta?: string; papel?: string }) {
  const { color } = useTema();
  const fondo = tinta ?? color.marca;
  const trazo = papel ?? color.sobreMarca;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityLabel="GestAcademy">
      <Rect width={40} height={40} rx={12} fill={fondo} />
      <Path
        d="M26.72 13.28A9.5 9.5 0 1 0 29.5 20H21"
        fill="none"
        stroke={trazo}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={29.32} cy={10.68} r={1.9} fill={trazo} />
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
