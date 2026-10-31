import type { ReactElement, ReactNode } from 'react';
import { Animated as AnimatedRN, Easing as EasingRN, Platform } from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';

// Transiciones entre pantallas: nada debe sentirse como un salto.

// Pestañas (Inicio, Alumnos, Cobros...): fundido cruzado con un desplazamiento leve hacia el
// lado de la pestaña elegida y un mínimo acercamiento, como al cambiar de sección en iOS.
// `progress` vale -1 (pestaña a la izquierda), 0 (activa) o 1 (a la derecha).
export const transicionPestanas = {
  transitionSpec: {
    animation: 'timing' as const,
    // Curva suave y pareja (la de iOS): ni arranca de golpe ni frena en seco
    config: { duration: 360, easing: EasingRN.bezier(0.25, 0.1, 0.25, 1) },
  },
  sceneStyleInterpolator: ({ current }: { current: { progress: AnimatedRN.Value } }) => ({
    sceneStyle: {
      // La que sale se desvanece mientras entra la nueva: un cruce, nunca un hueco vacío
      opacity: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
      transform: [
        { translateX: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [-14, 0, 14] }) },
        { scale: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.99, 1, 0.99] }) },
      ],
    },
  }),
};

// En la web las pantallas apiladas (Ajustes, Asistencias, el registro) aparecerían de golpe:
// entran con un fundido. En el celular la pila ya las desliza de forma nativa.
const entradaWeb = FadeIn.duration(260).easing(Easing.out(Easing.cubic));

function Entrada({ children }: { children: ReactNode }) {
  return (
    <Animated.View entering={entradaWeb} style={{ flex: 1 }}>
      {children}
    </Animated.View>
  );
}

// Para el `screenLayout` de las pilas: envuelve cada pantalla con su entrada (solo en web)
export const pantallaConEntrada =
  Platform.OS === 'web' ? ({ children }: { children: ReactElement }) => <Entrada>{children}</Entrada> : undefined;
