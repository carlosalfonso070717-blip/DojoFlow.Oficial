import { useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Cada párpado son dos curvas cúbicas con los mismos puntos de control abierto y cerrado,
// así el trazo se puede interpolar punto por punto.
// Cerrado = el ícono Iconly "Hide" (un párpado curvo hacia abajo).
const CERRADO = [3, 8, 5, 12.2, 8.6, 14.6, 12.25, 14.6, 15.9, 14.6, 19.5, 12.2, 21.5, 8];
const ARRIBA_ABIERTO = [3, 12, 5, 7.6, 8.6, 5.5, 12.25, 5.5, 15.9, 5.5, 19.5, 7.6, 21.5, 12];
const ABAJO_ABIERTO = [3, 12, 5, 16.4, 8.6, 18.5, 12.25, 18.5, 15.9, 18.5, 19.5, 16.4, 21.5, 12];

// Pestañas del ícono "Hide": [x1, y1, x2, y2]
const PESTANAS = [
  [18.8398, 11.8795, 20.951, 13.9906],
  [5.5813, 11.8795, 3.47019, 13.9906],
  [15.4268, 17.197, 14.5823, 14.2875],
  [8.99338, 17.1973, 9.83789, 14.2877],
];

function parpado(desde: number[], hasta: number[], t: number) {
  'worklet';
  const p = desde.map((v, i) => v + (hasta[i] - v) * t);
  return `M${p[0]} ${p[1]} C${p[2]} ${p[3]} ${p[4]} ${p[5]} ${p[6]} ${p[7]} C${p[8]} ${p[9]} ${p[10]} ${p[11]} ${p[12]} ${p[13]}`;
}

type Props = { abierto: boolean; size?: number; color?: string; strokeWidth?: number };

// Ojo que se abre (contraseña visible) o se cierra (oculta) con una transición continua
export function OjoAnimado({ abierto, size = 24, color = '#000', strokeWidth = 1.5 }: Props) {
  const sinMovimiento = useReducedMotion();
  const t = useSharedValue(abierto ? 1 : 0);

  useEffect(() => {
    const destino = abierto ? 1 : 0;
    t.value = sinMovimiento ? destino : withTiming(destino, { duration: 280, easing: Easing.inOut(Easing.cubic) });
  }, [abierto, sinMovimiento, t]);

  const arriba = useAnimatedProps(() => ({ d: parpado(CERRADO, ARRIBA_ABIERTO, t.value) }));
  const abajo = useAnimatedProps(() => ({ d: parpado(CERRADO, ABAJO_ABIERTO, t.value) }));
  // La pupila aparece en la segunda mitad, cuando el ojo ya tiene espacio
  const pupila = useAnimatedProps(() => {
    const v = Math.max(0, (t.value - 0.4) / 0.6);
    return { r: 3 * v, opacity: v };
  });
  // Las pestañas se desvanecen en la primera mitad
  const pestanas = useAnimatedProps(() => ({ opacity: Math.max(0, 1 - t.value * 2.2) }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <AnimatedPath animatedProps={arriba} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <AnimatedPath animatedProps={abajo} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <AnimatedCircle animatedProps={pupila} cx={12.25} cy={12} stroke={color} strokeWidth={strokeWidth} />
      {PESTANAS.map(([x1, y1, x2, y2], i) => (
        <AnimatedPath
          key={i}
          animatedProps={pestanas}
          d={`M${x1} ${y1} L${x2} ${y2}`}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="square"
        />
      ))}
    </Svg>
  );
}
