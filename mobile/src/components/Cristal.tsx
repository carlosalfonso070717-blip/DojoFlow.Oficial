import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiseno } from '@/hooks/useDiseno';
import { useTema } from '@/theme';
import { conAlfa } from '@/theme/color';
import { Texto } from './Texto';

// Alto de la barra de navegación compacta (sin el área segura), como la de iOS
export const ALTO_BARRA = 52;

type PropsCristal = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  // Qué tanto se difumina lo de atrás (1 a 100)
  intensidad?: number;
  // Material más opaco para paneles con mucho texto (hojas, diálogos)
  grueso?: boolean;
};

// Material de cristal: difumina lo que pasa por debajo y lo tiñe con el fondo del tema.
// En Android (sin desenfoque nativo por defecto) queda como un velo translúcido del mismo tono.
export function Cristal({ children, style, intensidad = 60, grueso }: PropsCristal) {
  const { color, oscuro } = useTema();
  const tinte = oscuro ? (grueso ? 'systemThickMaterialDark' : 'systemChromeMaterialDark') : grueso ? 'systemThickMaterialLight' : 'systemChromeMaterialLight';
  // El velo da el tono de la marca al cristal; en Android hace todo el trabajo
  const velo = conAlfa(grueso ? color.superficieElevada : color.fondo, Platform.OS === 'android' ? 0.94 : grueso ? 0.55 : 0.45);
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <BlurView intensity={intensidad} tint={tinte} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: velo }]} />
      {children}
    </View>
  );
}

// Desplazamiento de una pantalla: lo leen la barra de cristal y cualquier efecto ligado al scroll
export function useDesplazamiento() {
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  return { y, props: { onScroll, scrollEventThrottle: 16 } };
}

// Barra de navegación al estilo iOS: invisible mientras se ve el título grande de la sección;
// al desplazarse, el contenido pasa por debajo de un cristal con el título compacto.
export function BarraCristal({ y, titulo, accion }: { y: SharedValue<number>; titulo: string; accion?: ReactNode }) {
  const { color } = useTema();
  const insets = useSafeAreaInsets();
  const { margen, esEscritorio, arriba } = useDiseno();
  const alto = (esEscritorio ? 0 : insets.top) + ALTO_BARRA;
  // El título grande deja de verse cuando cruza la barra: ahí aparece el compacto
  const inicio = arriba + 4;

  const material = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [inicio, inicio + 24], [0, 1], Extrapolation.CLAMP) }));
  const tituloAnimado = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [inicio + 12, inicio + 36], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.value, [inicio + 12, inicio + 36], [6, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <View pointerEvents="box-none" style={[estilos.barra, { height: alto }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, material]}>
        <Cristal style={StyleSheet.absoluteFill} />
        <View style={[estilos.filo, { backgroundColor: color.borde }]} />
      </Animated.View>
      <View pointerEvents="box-none" style={[estilos.fila, { height: ALTO_BARRA, paddingHorizontal: margen }]}>
        <Animated.View
          pointerEvents="none"
          style={[estilos.titulo, esEscritorio ? { alignItems: 'flex-start', paddingHorizontal: margen } : { alignItems: 'center', paddingHorizontal: 72 }, tituloAnimado]}
        >
          <Texto variante="subtitulo" numberOfLines={1}>
            {titulo}
          </Texto>
        </Animated.View>
        {accion && <Animated.View style={[estilos.accion, { right: margen }, tituloAnimado]}>{accion}</Animated.View>}
      </View>
    </View>
  );
}

// Lo que necesita una sección con título grande: el scroll, el aire de arriba y la barra
export function useSeccionCristal(titulo: string, accion?: ReactNode) {
  const insets = useSafeAreaInsets();
  const { arriba, esEscritorio } = useDiseno();
  const { y, props } = useDesplazamiento();
  return {
    desplazamiento: props,
    // El contenido arranca bajo el área segura; al subir pasa por debajo del cristal
    arriba: (esEscritorio ? 0 : insets.top) + arriba,
    barra: <BarraCristal y={y} titulo={titulo} accion={accion} />,
  };
}

const estilos = StyleSheet.create({
  barra: { position: 'absolute', top: 0, left: 0, right: 0, justifyContent: 'flex-end', zIndex: 10 },
  filo: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
  fila: { justifyContent: 'center' },
  titulo: { position: 'absolute', left: 0, right: 0 },
  accion: { position: 'absolute' },
});
