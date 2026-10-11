import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  // Qué tanto se encoge al presionar; los elementos grandes se mueven menos
  escala?: number;
  vibracion?: 'ligera' | 'media' | 'ninguna';
};

// Respuesta táctil común: se hunde al tocar y vibra suave, como un botón físico
export function Presionable({ escala = 0.97, vibracion = 'ligera', onPressIn, onPressOut, onPress, style, disabled, ...props }: Props) {
  const presion = useSharedValue(1);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: presion.value }] }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
      onPressIn={(e) => {
        presion.set(withTiming(escala, { duration: 90 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        presion.set(withSpring(1, { damping: 14, stiffness: 260 }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (vibracion !== 'ninguna') {
          Haptics.impactAsync(vibracion === 'media' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.(e);
      }}
      style={[style, animado]}
    />
  );
}
