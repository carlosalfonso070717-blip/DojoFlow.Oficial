import { LinearGradient } from 'expo-linear-gradient';
import { Children, isValidElement, type ComponentType, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTema } from '@/theme';
import type { PropsIcono } from './iconos/Iconly';
import { Presionable } from './Presionable';
import { Texto } from './Texto';

export type TonoTarjeta = 'marca' | 'exito' | 'aviso' | 'peligro' | 'neutro';

// Sombra suave en modo claro; en oscuro una sombra profunda que despega el cristal del fondo
export function useSombra(nivel: 'baja' | 'alta' = 'baja'): ViewStyle {
  const { oscuro, color } = useTema();
  if (oscuro) return { boxShadow: color.sombra } as ViewStyle;
  return {
    boxShadow:
      nivel === 'alta'
        ? '0 1px 2px rgba(16,18,24,0.05), 0 6px 14px -6px rgba(16,18,24,0.10), 0 22px 44px -18px rgba(16,18,24,0.20)'
        : '0 0.5px 1px rgba(16,18,24,0.05), 0 4px 18px -8px rgba(16,18,24,0.10)',
  } as ViewStyle;
}

function useColoresTono(tono: TonoTarjeta): [string, string] {
  const { color } = useTema();
  const paleta: Record<TonoTarjeta, [string, string]> = {
    marca: [color.marcaSuave, color.marcaTexto],
    exito: [color.exitoSuave, color.exito],
    aviso: [color.avisoSuave, color.aviso],
    peligro: [color.peligroSuave, color.peligro],
    neutro: [color.fondo, color.textoSuave],
  };
  return paleta[tono];
}

// Fondo de cristal de las tarjetas en modo oscuro: degradado vertical apenas perceptible
export function Vidrio({ radio }: { radio: number }) {
  const { color, oscuro } = useTema();
  if (!oscuro) return null;
  return <LinearGradient pointerEvents="none" colors={color.vidrio} style={[StyleSheet.absoluteFill, { borderRadius: radio }]} />;
}

// Resplandor del color de la academia detrás del contenido de las secciones principales,
// como una luz cálida que entra desde arriba y se apaga antes de la mitad de la pantalla
export function LuzAmbiental() {
  const { color } = useTema();
  return (
    <View pointerEvents="none" style={estilos.luz}>
      <LinearGradient colors={color.ambiente} style={StyleSheet.absoluteFill} />
    </View>
  );
}

// Tarjeta base: cristal, filo de luz arriba, radio amplio y sombra
export function Tarjeta({ children, style, onPress, etiqueta }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; etiqueta?: string }) {
  const { color, radio } = useTema();
  const sombra = useSombra();
  const base = [
    estilos.tarjeta,
    { backgroundColor: color.superficie, borderColor: color.contorno, borderTopColor: color.contornoLuz, borderRadius: radio.xl },
    sombra,
    style,
  ];
  const contenido = (
    <>
      <Vidrio radio={radio.xl - 1} />
      {children}
    </>
  );
  if (!onPress) return <View style={base}>{contenido}</View>;
  return (
    <Presionable onPress={onPress} escala={0.98} accessibilityRole="button" accessibilityLabel={etiqueta} style={base}>
      {contenido}
    </Presionable>
  );
}

// Círculo de color con un ícono: identifica cada indicador o acción
export function IconoTonal({ icono: Icono, tono = 'marca', tamano = 40 }: { icono: ComponentType<PropsIcono>; tono?: TonoTarjeta; tamano?: number }) {
  const [fondo, frente] = useColoresTono(tono);
  return (
    <View style={{ width: tamano, height: tamano, borderRadius: tamano * 0.32, backgroundColor: fondo, alignItems: 'center', justifyContent: 'center' }}>
      <Icono size={Math.round(tamano * 0.5)} color={frente} strokeWidth={1.9} />
    </View>
  );
}

type PropsIndicador = {
  icono: ComponentType<PropsIcono>;
  etiqueta: string;
  valor: string;
  detalle?: string;
  tono?: TonoTarjeta;
  onPress?: () => void;
  // La cifra protagonista va sobre el color de la academia, con brillo
  destacado?: boolean;
};

// Cifra clave del negocio en su propia tarjeta (alumnos, por cobrar, vencidos...)
export function Indicador({ icono: Icono, etiqueta, valor, detalle, tono = 'marca', onPress, destacado }: PropsIndicador) {
  const { color, radio } = useTema();
  if (destacado) {
    return (
      <Presionable
        onPress={onPress}
        disabled={!onPress}
        escala={0.98}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${etiqueta}: ${valor}`}
        style={[estilos.indicador, estilos.destacado, { borderRadius: radio.xl, boxShadow: `0 18px 40px -16px ${color.brillo}` } as ViewStyle]}
      >
        <LinearGradient colors={color.degradadoMarca} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: radio.xl }]} />
        {/* Reflejo de luz en la esquina superior */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.4, y: 0.7 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radio.xl }]}
        />
        <View style={[estilos.iconoDestacado, { borderRadius: 38 * 0.32 }]}>
          <Icono size={19} color={color.sobreMarca} strokeWidth={1.9} />
        </View>
        <View style={{ gap: 2 }}>
          <Texto variante="cifra" cifras numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 26, lineHeight: 30, color: color.sobreMarca }}>
            {valor}
          </Texto>
          <Texto variante="detalle" numberOfLines={1} style={{ color: color.sobreMarca, opacity: 0.85 }}>
            {etiqueta}
          </Texto>
          {detalle ? (
            <Texto variante="pequeno" numberOfLines={1} style={{ color: color.sobreMarca, opacity: 0.7 }}>
              {detalle}
            </Texto>
          ) : null}
        </View>
      </Presionable>
    );
  }
  return (
    <Tarjeta onPress={onPress} etiqueta={`${etiqueta}: ${valor}`} style={estilos.indicador}>
      <IconoTonal icono={Icono} tono={tono} tamano={38} />
      <View style={{ gap: 2 }}>
        <Texto variante="cifra" cifras numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 26, lineHeight: 30 }}>
          {valor}
        </Texto>
        <Texto variante="detalle" tono="suave" numberOfLines={1}>
          {etiqueta}
        </Texto>
        {detalle ? (
          <Texto variante="pequeno" tono="tenue" numberOfLines={1}>
            {detalle}
          </Texto>
        ) : null}
      </View>
    </Tarjeta>
  );
}

// Acción rápida: ícono, título y descripción corta; la destacada lleva el color de la academia
export function TarjetaAccion({
  icono: Icono,
  titulo,
  detalle,
  onPress,
  destacada,
}: {
  icono: ComponentType<PropsIcono>;
  titulo: string;
  detalle?: string;
  onPress: () => void;
  destacada?: boolean;
}) {
  const { color, radio } = useTema();
  const sombra = useSombra(destacada ? 'alta' : 'baja');
  return (
    <Presionable
      onPress={onPress}
      escala={0.97}
      vibracion="media"
      accessibilityRole="button"
      accessibilityLabel={titulo}
      style={[
        estilos.accion,
        {
          borderRadius: radio.xl,
          backgroundColor: destacada ? color.marca : color.superficie,
          borderColor: destacada ? color.marca : color.contorno,
          borderTopColor: destacada ? color.marca : color.contornoLuz,
        },
        destacada ? ({ boxShadow: `0 16px 36px -14px ${color.brillo}` } as ViewStyle) : sombra,
      ]}
    >
      {destacada ? (
        <LinearGradient colors={color.degradadoMarca} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: radio.xl - 1 }]} />
      ) : (
        <Vidrio radio={radio.xl - 1} />
      )}
      <View
        style={[estilos.iconoAccion, { backgroundColor: destacada ? 'rgba(255,255,255,0.18)' : color.marcaSuave, borderRadius: radio.m }]}
      >
        <Icono size={22} color={destacada ? color.sobreMarca : color.marcaTexto} strokeWidth={1.9} />
      </View>
      <View style={{ gap: 2 }}>
        <Texto variante="cuerpoFuerte" numberOfLines={1} style={{ color: destacada ? color.sobreMarca : color.texto }}>
          {titulo}
        </Texto>
        {detalle ? (
          <Texto variante="pequeno" numberOfLines={2} style={{ color: destacada ? color.sobreMarca : color.textoSuave, opacity: destacada ? 0.82 : 1 }}>
            {detalle}
          </Texto>
        ) : null}
      </View>
    </Presionable>
  );
}

export type DatoResumen = { etiqueta: string; valor: string; tono?: TonoTarjeta; activo?: boolean; onPress?: () => void };

// Cifras clave en el celular: tarjetas pequeñas que se deslizan de lado, de borde a borde de la pantalla.
// `sangria` es el margen lateral de la pantalla, para que el carrusel llegue al borde sin cortar la primera tarjeta.
export function ResumenMovil({ datos, sangria }: { datos: DatoResumen[]; sangria: number }) {
  const { color, radio } = useTema();
  const sombra = useSombra();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -sangria }}
      contentContainerStyle={{ paddingHorizontal: sangria, gap: 10 }}
    >
      {datos.map(({ etiqueta, valor, tono = 'neutro', activo, onPress }) => (
        <DatoResumenTarjeta key={etiqueta} etiqueta={etiqueta} valor={valor} tono={tono} activo={activo} onPress={onPress} color={color} radio={radio.l + 2} sombra={sombra} />
      ))}
    </ScrollView>
  );
}

function DatoResumenTarjeta({
  etiqueta,
  valor,
  tono,
  activo,
  onPress,
  color,
  radio,
  sombra,
}: Required<Pick<DatoResumen, 'etiqueta' | 'valor' | 'tono'>> &
  Pick<DatoResumen, 'activo' | 'onPress'> & { color: ReturnType<typeof useTema>['color']; radio: number; sombra: ViewStyle }) {
  const [, frente] = useColoresTono(tono);
  const contenido = (
    <>
      <Vidrio radio={radio - 1} />
      <View style={estilos.etiquetaResumen}>
        <View style={[estilos.punto, { backgroundColor: tono === 'neutro' ? color.textoTenue : frente }]} />
        <Texto variante="pequeno" tono="suave" numberOfLines={1}>
          {etiqueta}
        </Texto>
      </View>
      <Texto variante="encabezado" cifras numberOfLines={1} style={{ fontSize: 20, lineHeight: 24 }}>
        {valor}
      </Texto>
    </>
  );
  const estilo = [
    estilos.resumen,
    {
      backgroundColor: color.superficie,
      borderColor: activo ? color.marcaTexto : color.contorno,
      borderTopColor: activo ? color.marcaTexto : color.contornoLuz,
      borderRadius: radio,
      borderWidth: activo ? 1.5 : StyleSheet.hairlineWidth,
    },
    activo ? ({ boxShadow: `0 10px 26px -14px ${color.brillo}` } as ViewStyle) : sombra,
  ];
  if (!onPress) return <View style={estilo}>{contenido}</View>;
  return (
    <Presionable onPress={onPress} escala={0.97} accessibilityRole="button" accessibilityLabel={`${etiqueta}: ${valor}`} accessibilityState={{ selected: !!activo }} style={estilo}>
      {contenido}
    </Presionable>
  );
}

// Reparte sus hijos en filas de `columnas` elementos del mismo ancho
export function Rejilla({ columnas, children, espacio = 12 }: { columnas: number; children: ReactNode; espacio?: number }) {
  const hijos = Children.toArray(children).filter(isValidElement);
  const filas: ReactNode[][] = [];
  for (let i = 0; i < hijos.length; i += columnas) filas.push(hijos.slice(i, i + columnas));
  return (
    <View style={{ gap: espacio }}>
      {filas.map((fila, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: espacio }}>
          {fila.map((hijo, j) => (
            <View key={j} style={{ flex: 1 }}>
              {hijo}
            </View>
          ))}
          {/* La última fila incompleta conserva el ancho de las demás */}
          {Array.from({ length: columnas - fila.length }, (_, k) => (
            <View key={`hueco-${k}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}

// Título de una sección dentro de una pantalla, con acción opcional a la derecha
export function TituloSeccion({ titulo, accion }: { titulo: string; accion?: ReactNode }) {
  return (
    <View style={estilos.tituloSeccion}>
      <Texto variante="subtitulo" accessibilityRole="header">
        {titulo}
      </Texto>
      {accion}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  luz: { position: 'absolute', top: 0, left: 0, right: 0, height: 560 },
  indicador: { gap: 14, padding: 16, flex: 1 },
  destacado: { borderWidth: 0, overflow: 'visible' },
  iconoDestacado: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  accion: { borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 14, flex: 1, minHeight: 128 },
  iconoAccion: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  resumen: { minWidth: 128, paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  etiquetaResumen: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  punto: { width: 7, height: 7, borderRadius: 4 },
  iconoAjuste: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' },
  tituloSeccion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
});

// Colores de sistema de Apple para los íconos de Ajustes
export const COLORES_AJUSTE = {
  azul: '#0a84ff',
  verde: '#30b158',
  naranja: '#ff9500',
  morado: '#af52de',
  rosa: '#ff2d55',
  indigo: '#5856d6',
  turquesa: '#30b0c7',
  gris: '#8e8e93',
  rojo: '#ff3b30',
} as const;

// Ícono blanco sobre un cuadrito de color, como en la app Ajustes del iPhone
export function IconoAjuste({ icono: Icono, fondo }: { icono: ComponentType<PropsIcono>; fondo: string }) {
  return (
    <View style={[estilos.iconoAjuste, { backgroundColor: fondo }]}>
      <Icono size={18} color="#ffffff" strokeWidth={2} />
    </View>
  );
}
