import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTema } from '@/theme';
import type { PropsIcono } from './iconos/Iconly';
import { Presionable } from './Presionable';
import { Texto } from './Texto';

type Opcion<T extends string> = { valor: T; etiqueta: string; conteo?: number };

// Selector de filtros mutuamente excluyentes (Todos / Pendientes / Vencidos...)
type Props<T extends string> = {
  opciones: Opcion<T>[];
  valor: T;
  onCambio: (v: T) => void;
  // Ícono opcional antes del selector (p. ej. filtro)
  icono?: ComponentType<PropsIcono>;
};

export function Segmentos<T extends string>({ opciones, valor, onCambio, icono: Icono }: Props<T>) {
  const { color, radio } = useTema();
  return (
    <View style={estilos.fila}>
      {Icono && <Icono size={22} color={color.textoSuave} />}
      <View accessibilityRole="tablist" style={[estilos.contenedor, { backgroundColor: color.borde, borderRadius: radio.m }]}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <Presionable
            key={o.valor}
            onPress={() => onCambio(o.valor)}
            escala={0.96}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            style={[estilos.opcion, { borderRadius: radio.s }, activo && { backgroundColor: color.superficie }]}
          >
            <Texto
              variante="detalle"
              numberOfLines={1}
              style={{ fontSize: 13, color: activo ? color.texto : color.textoSuave, fontFamily: activo ? 'Figtree_700Bold' : 'Figtree_500Medium' }}
            >
              {o.etiqueta}
              {o.conteo ? ` ${o.conteo}` : ''}
            </Texto>
          </Presionable>
        );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contenedor: { flex: 1, flexDirection: 'row', padding: 3 },
  opcion: { flex: 1, alignItems: 'center', paddingVertical: 9, paddingHorizontal: 2 },
});
