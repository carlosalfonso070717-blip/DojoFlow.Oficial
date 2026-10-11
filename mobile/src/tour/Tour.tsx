import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { marcarTourCompletado } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { Boton, Texto } from '@/components/ui';
import { useTema } from '@/theme';
import { plural } from '@/utils/texto';

type Medida = { x: number; y: number; w: number; h: number };
type Medible = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void };

export type IdObjetivo = 'credencial' | 'pendiente' | 'inscribir' | 'barra' | 'ajustes';

type Paso = { id: IdObjetivo; titulo: string; texto: string };

type Contexto = {
  registrar: (id: IdObjetivo, nodo: Medible | null) => void;
  iniciar: () => void;
  activo: boolean;
};

const TourContext = createContext<Contexto | null>(null);

const HOLGURA = 8; // aire alrededor del elemento iluminado
const RADIO_HUECO = 26;
const RectAnimado = Animated.createAnimatedComponent(Rect);
const DURACION = 380;

export function ProveedorTour({ children }: { children: ReactNode }) {
  const { perfil, recargarPerfil } = useSesion();
  const objetivos = useRef(new Map<IdObjetivo, Medible>());
  const [activo, setActivo] = useState(false);
  const [indice, setIndice] = useState(0);
  const [medida, setMedida] = useState<Medida | null>(null);

  const termino = perfil?.academia.terminoAlumno || 'Alumno';
  const pasos: Paso[] = [
    {
      id: 'credencial',
      titulo: 'Esta es tu academia',
      texto: `Aquí ves de un vistazo cuántos ${plural(termino).toLowerCase()} tienes y cuánto ha entrado este mes.`,
    },
    { id: 'pendiente', titulo: 'Lo que requiere atención', texto: 'Recibos vencidos, cobros pendientes y productos por resurtir aparecen aquí.' },
    {
      id: 'inscribir',
      titulo: `Inscribe a tu primer ${termino.toLowerCase()}`,
      texto: 'Cada inscripción genera un PIN para el kiosco y su primer recibo.',
    },
    { id: 'barra', titulo: 'Todo a un toque', texto: `Cambia entre ${plural(termino).toLowerCase()}, cobros, inventario y finanzas desde esta barra.` },
    { id: 'ajustes', titulo: 'Hazla tuya', texto: 'En Ajustes cambias colores, logo, clases, precios y la forma de cobro.' },
  ];
  const paso = pasos[indice];

  const registrar = useCallback((id: IdObjetivo, nodo: Medible | null) => {
    if (nodo) objetivos.current.set(id, nodo);
    else objetivos.current.delete(id);
  }, []);

  const medir = useCallback((id: IdObjetivo) => {
    const nodo = objetivos.current.get(id);
    if (!nodo) return setMedida(null);
    nodo.measureInWindow((x, y, w, h) => setMedida({ x, y, w, h }));
  }, []);

  useEffect(() => {
    if (activo && paso) medir(paso.id);
    // `paso` y `medir` dependen solo de `indice`, que ya está en la lista
  }, [activo, indice]);

  const iniciar = useCallback(() => {
    setIndice(0);
    setActivo(true);
  }, []);

  async function terminar() {
    setActivo(false);
    if (perfil && !perfil.usuario.tourCompletado) {
      await marcarTourCompletado().catch(() => {});
      await recargarPerfil().catch(() => {});
    }
  }

  function siguiente() {
    Haptics.selectionAsync().catch(() => {});
    if (indice === pasos.length - 1) terminar();
    else setIndice((i) => i + 1);
  }

  return (
    <TourContext.Provider value={{ registrar, iniciar, activo }}>
      {children}
      <Modal visible={activo} transparent animationType="none" statusBarTranslucent onRequestClose={terminar}>
        {medida && paso && (
          <Capa
            medida={medida}
            paso={paso}
            indice={indice}
            total={pasos.length}
            onSiguiente={siguiente}
            onOmitir={terminar}
          />
        )}
      </Modal>
    </TourContext.Provider>
  );
}

function Capa({
  medida,
  paso,
  indice,
  total,
  onSiguiente,
  onOmitir,
}: {
  medida: Medida;
  paso: Paso;
  indice: number;
  total: number;
  onSiguiente: () => void;
  onOmitir: () => void;
}) {
  const { color, radio } = useTema();
  const { width, height } = useWindowDimensions();


  // El hueco iluminado se desliza de un elemento al siguiente
  const x = useSharedValue(medida.x - HOLGURA);
  const y = useSharedValue(medida.y - HOLGURA);
  const w = useSharedValue(medida.w + HOLGURA * 2);
  const h = useSharedValue(medida.h + HOLGURA * 2);

  useEffect(() => {
    const animar = { duration: DURACION, easing: Easing.inOut(Easing.cubic) };
    x.value = withTiming(medida.x - HOLGURA, animar);
    y.value = withTiming(medida.y - HOLGURA, animar);
    w.value = withTiming(medida.w + HOLGURA * 2, animar);
    h.value = withTiming(medida.h + HOLGURA * 2, animar);
  }, [medida, x, y, w, h]);

  // El hueco es un rectángulo redondeado recortado del velo con una máscara
  const hueco = useAnimatedProps(() => ({ x: x.value, y: y.value, width: w.value, height: h.value }));

  // La tarjeta va debajo del elemento si cabe; si no, arriba
  const abajoDelObjetivo = medida.y + medida.h + HOLGURA + 220 < height;
  const anchoTarjeta = Math.min(width - 32, 420);
  const posicion = abajoDelObjetivo
    ? { top: medida.y + medida.h + HOLGURA + 14 }
    : { bottom: height - medida.y + HOLGURA + 14 };
  const velo = 'rgba(6,7,10,0.72)';

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id="velo-tour">
            <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />
            <RectAnimado animatedProps={hueco} rx={RADIO_HUECO} ry={RADIO_HUECO} fill="#000000" />
          </Mask>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={velo} mask="url(#velo-tour)" />
        <RectAnimado animatedProps={hueco} rx={RADIO_HUECO} ry={RADIO_HUECO} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={2} />
      </Svg>

      <Animated.View
        key={paso.id}
        entering={FadeIn.duration(260).delay(120)}
        style={[
          estilos.tarjeta,
          posicion,
          { width: anchoTarjeta, left: (width - anchoTarjeta) / 2, backgroundColor: color.superficieElevada, borderRadius: radio.xl },
        ]}
        accessibilityViewIsModal
      >
        <Texto variante="pequeno" tono="tenue" cifras>
          {indice + 1} de {total}
        </Texto>
        <Texto variante="encabezado">{paso.titulo}</Texto>
        <Texto variante="cuerpo" tono="suave">
          {paso.texto}
        </Texto>
        <View style={estilos.botones}>
          <Boton titulo="Omitir" variante="fantasma" tamano="compacto" onPress={onOmitir} />
          <Boton titulo={indice === total - 1 ? 'Empezar' : 'Siguiente'} tamano="compacto" onPress={onSiguiente} style={{ minWidth: 120 }} />
        </View>
      </Animated.View>
    </View>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour debe usarse dentro de <ProveedorTour>');
  return ctx;
}

// Para marcar un elemento como paso del tour: <View ref={useObjetivoTour('credencial')} collapsable={false}>
export function useObjetivoTour(id: IdObjetivo) {
  const { registrar } = useTour();
  return useCallback((nodo: View | null) => registrar(id, nodo), [id, registrar]);
}

const estilos = StyleSheet.create({
  tarjeta: { position: 'absolute', padding: 22, gap: 8 },
  botones: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
});
