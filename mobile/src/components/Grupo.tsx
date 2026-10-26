import { ChevronRight } from 'lucide-react-native';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useDiseno } from '@/hooks/useDiseno';
import { useSombra, Vidrio } from './Tarjetas';
import { useTema } from '@/theme';
import { Presionable } from './Presionable';
import { Texto } from './Texto';

// Contenedor principal de la app: una superficie que agrupa filas relacionadas,
// separadas por líneas finas (en lugar de una tarjeta por cada elemento)
export function Grupo({ titulo, children, style }: { titulo?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { color, radio } = useTema();
  const sombra = useSombra();
  const hijos = Children.toArray(children).filter(isValidElement);

  return (
    <View style={[{ gap: 8 }, style]}>
      {titulo && (
        <Texto variante="pequeno" tono="suave" style={estilos.tituloGrupo}>
          {titulo}
        </Texto>
      )}
      <View style={[estilos.superficie, { backgroundColor: color.superficie, borderRadius: radio.l, borderColor: color.contorno, borderTopColor: color.contornoLuz }, sombra]}>
        <Vidrio radio={radio.l - 1} />
        {hijos.map((hijo, i) => (
          <Fragment key={hijo.key ?? i}>
            {i > 0 && <View style={[estilos.separador, { backgroundColor: color.borde }, conIcono(hijo) && { marginLeft: 58 }]} />}
            {hijo}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

// Como en iOS, la línea entre filas empieza donde empieza el texto, no bajo el ícono
const conIcono = (hijo: ReactNode) => isValidElement<{ izquierda?: ReactNode }>(hijo) && !!hijo.props.izquierda;

type FilaProps = {
  titulo: string;
  detalle?: string;
  izquierda?: ReactNode;
  derecha?: ReactNode;
  onPress?: () => void;
  // Contenido extra debajo del título (insignias, acciones)
  children?: ReactNode;
  // Alinea izquierda/derecha con el título en vez de centrarlas (filas altas)
  alinearArriba?: boolean;
};

export function Fila({ titulo, detalle, izquierda, derecha, onPress, children, alinearArriba }: FilaProps) {
  const { color } = useTema();
  const contenido = (
    <View style={[estilos.fila, alinearArriba && { alignItems: 'flex-start' }]}>
      {izquierda}
      <View style={{ flex: 1, gap: 2 }}>
        <Texto variante="cuerpoFuerte" numberOfLines={1}>
          {titulo}
        </Texto>
        {detalle ? (
          <Texto variante="detalle" tono="suave" numberOfLines={2}>
            {detalle}
          </Texto>
        ) : null}
        {children}
      </View>
      {derecha}
      {onPress && !derecha && <ChevronRight size={18} color={color.textoTenue} />}
    </View>
  );

  if (!onPress) return contenido;
  return (
    <Presionable onPress={onPress} escala={0.985} accessibilityRole="button" accessibilityLabel={titulo}>
      {contenido}
    </Presionable>
  );
}

// Para FlatList: cada elemento se dibuja como parte de un mismo grupo continuo
export function ItemGrupo({ indice, total, children }: { indice: number; total: number; children: ReactNode }) {
  const { color, radio } = useTema();
  const primero = indice === 0;
  const ultimo = indice === total - 1;
  return (
    <View
      style={{
        backgroundColor: color.superficie,
        borderColor: color.contorno,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderTopWidth: primero ? StyleSheet.hairlineWidth : 0,
        borderBottomWidth: ultimo ? StyleSheet.hairlineWidth : 0,
        borderTopLeftRadius: primero ? radio.l : 0,
        borderTopRightRadius: primero ? radio.l : 0,
        borderBottomLeftRadius: ultimo ? radio.l : 0,
        borderBottomRightRadius: ultimo ? radio.l : 0,
        overflow: 'hidden',
      }}
    >
      {!primero && <View style={[estilos.separador, { backgroundColor: color.borde }]} />}
      {children}
    </View>
  );
}

const ESPACIO_REJILLA = 14;
const ESPACIO_LISTA = 10;

// Listas responsivas: tarjetas separadas en una columna en el celular, rejilla de tarjetas en escritorio.
// Uso: <FlatList key={rejilla.clave} {...rejilla.props} renderItem={() => <CeldaLista ...>} />
export function useRejilla() {
  const { columnas } = useDiseno();
  return {
    columnas,
    // FlatList no permite cambiar numColumns en caliente: con otra key se vuelve a montar
    clave: `columnas-${columnas}`,
    props: {
      numColumns: columnas,
      columnWrapperStyle: columnas > 1 ? { gap: ESPACIO_REJILLA } : undefined,
      ItemSeparatorComponent: columnas > 1 ? SeparadorRejilla : SeparadorLista,
    },
  };
}

function SeparadorRejilla() {
  return <View style={{ height: ESPACIO_REJILLA }} />;
}

function SeparadorLista() {
  return <View style={{ height: ESPACIO_LISTA }} />;
}

// Celda de una lista: tarjeta suelta en una columna (celular) o en la rejilla (escritorio)
export function CeldaLista({ columnas, children }: { indice?: number; total?: number; columnas: number; children: ReactNode }) {
  const { color, radio } = useTema();
  const sombra = useSombra();
  if (columnas <= 1) {
    return (
      <View style={[estilos.tarjetaLista, { backgroundColor: color.superficie, borderColor: color.contorno, borderTopColor: color.contornoLuz, borderRadius: radio.l + 2 }, sombra]}>
        <Vidrio radio={radio.l + 1} />
        {children}
      </View>
    );
  }

  // Todas las tarjetas miden lo mismo aunque la última fila quede incompleta
  const ancho = `calc(${100 / columnas}% - ${(ESPACIO_REJILLA * (columnas - 1)) / columnas}px)`;
  return (
    <View
      style={[
        estilos.tarjeta,
        { backgroundColor: color.superficie, borderColor: color.contorno, borderTopColor: color.contornoLuz, borderRadius: radio.l, maxWidth: ancho as unknown as number },
        sombra,
      ]}
    >
      <Vidrio radio={radio.l - 1} />
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { flex: 1, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  tarjetaLista: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  par: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingHorizontal: 16, paddingVertical: 14, minHeight: 52 },
  superficie: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  separador: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  // Como en Ajustes de iOS: mayúsculas pequeñas y espaciadas sobre el grupo
  tituloGrupo: { paddingHorizontal: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56 },
});

// Par etiqueta/valor para hojas de detalle (Cuota mensual: $850.00)
export function ParDato({ etiqueta, valor, children }: { etiqueta: string; valor?: string; children?: ReactNode }) {
  return (
    <View style={estilos.par}>
      <Texto variante="detalle" tono="suave">
        {etiqueta}
      </Texto>
      {valor !== undefined ? (
        <Texto variante="cuerpoFuerte" cifras style={{ textAlign: 'right', flexShrink: 1 }}>
          {valor}
        </Texto>
      ) : (
        children
      )}
    </View>
  );
}
