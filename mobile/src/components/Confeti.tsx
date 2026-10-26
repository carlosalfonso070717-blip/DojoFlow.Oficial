import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

type Pieza = {
  x: number;
  deriva: number;
  ancho: number;
  alto: number;
  color: string;
  giro: number;
  retraso: number;
  duracion: number;
  redonda: boolean;
};

const PIEZAS = 110;

// Generador pseudoaleatorio con semilla (mulberry32): mismo confeti en cada render, sin Math.random
function generador(semilla: number) {
  let a = semilla;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sortearPiezas(ancho: number, colores: string[]): Pieza[] {
  const azar = generador(20261026);
  return Array.from({ length: PIEZAS }, (_, i) => ({
    x: azar() * ancho,
    deriva: (azar() - 0.5) * 160,
    ancho: 6 + azar() * 6,
    alto: 10 + azar() * 8,
    color: colores[i % colores.length],
    giro: (azar() - 0.5) * 1440,
    retraso: azar() * 450,
    duracion: 2200 + azar() * 1500,
    redonda: azar() < 0.25,
  }));
}

// Lluvia de confeti para celebrar (p. ej. el pago del plan). Se dibuja encima de todo y no
// bloquea los toques. Con "reducir movimiento" activado no se muestra.
export function Confeti({ colores, activo }: { colores: string[]; activo: boolean }) {
  const { width, height } = useWindowDimensions();
  const reducir = useReducedMotion();

  const clave = colores.join();
  // Cada pieza con su posición, tamaño y ritmo propios; se sortean una sola vez
  const piezas = useMemo(() => sortearPiezas(width, clave.split(',')), [width, clave]);

  if (!activo || reducir) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 100, overflow: 'hidden' }]}>
      {piezas.map((p, i) => (
        <PiezaConfeti key={i} pieza={p} alto={height} />
      ))}
    </View>
  );
}

function PiezaConfeti({ pieza, alto }: { pieza: Pieza; alto: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(pieza.retraso, withTiming(1, { duration: pieza.duracion, easing: Easing.out(Easing.quad) }));
  }, [pieza, t]);

  const estilo = useAnimatedStyle(() => ({
    opacity: t.value < 0.85 ? 1 : (1 - t.value) / 0.15,
    transform: [
      { translateX: pieza.x + pieza.deriva * t.value + Math.sin(t.value * 10) * 14 },
      { translateY: -40 + (alto + 80) * t.value },
      { rotate: `${pieza.giro * t.value}deg` },
      // Al girar sobre sí mismo el papel se ve más angosto por momentos
      { scaleX: Math.cos(t.value * 18) },
    ],
  }));

  return (
    <Animated.View
      style={[
        estilos.pieza,
        { width: pieza.ancho, height: pieza.redonda ? pieza.ancho : pieza.alto, borderRadius: pieza.redonda ? pieza.ancho : 2, backgroundColor: pieza.color },
        estilo,
      ]}
    />
  );
}

const estilos = StyleSheet.create({
  pieza: { position: 'absolute', top: 0, left: 0 },
});
