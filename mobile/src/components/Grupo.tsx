import { ChevronRight } from 'lucide-react-native';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTema } from '@/theme';
import { Presionable } from './Presionable';
import { Texto } from './Texto';

// Contenedor principal de la app: una superficie que agrupa filas relacionadas,
// separadas por líneas finas (en lugar de una tarjeta por cada elemento)
export function Grupo({ titulo, children, style }: { titulo?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { color, radio } = useTema();
  const hijos = Children.toArray(children).filter(isValidElement);

  return (
    <View style={[{ gap: 8 }, style]}>
      {titulo && (
        <Texto variante="detalle" tono="suave" style={{ paddingHorizontal: 4 }}>
          {titulo}
        </Texto>
      )}
      <View style={[estilos.superficie, { backgroundColor: color.superficie, borderRadius: radio.l, borderColor: color.borde }]}>
        {hijos.map((hijo, i) => (
          <Fragment key={hijo.key ?? i}>
            {i > 0 && <View style={[estilos.separador, { backgroundColor: color.borde }]} />}
            {hijo}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

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
        borderColor: color.borde,
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

const estilos = StyleSheet.create({
  superficie: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  separador: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56 },
});
