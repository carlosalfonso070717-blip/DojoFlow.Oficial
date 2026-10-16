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
  const { color, radio, oscuro } = useTema();
  return (
    <View style={estilos.fila}>
      {Icono && <Icono size={22} color={color.textoSuave} />}
      <View accessibilityRole="tablist" style={[estilos.contenedor, { backgroundColor: oscuro ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)', borderRadius: radio.m - 2 }]}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <Presionable
            key={o.valor}
            onPress={() => onCambio(o.valor)}
            escala={0.96}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            style={[estilos.opcion, { borderRadius: radio.s }, activo && [estilos.activa, { backgroundColor: oscuro ? '#636366' : '#ffffff' }]]}
          >
            <Texto
              variante="detalle"
              numberOfLines={1}
              style={{ fontSize: 13, color: color.texto, fontFamily: activo ? 'Inter_600SemiBold' : 'Inter_500Medium' }}
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
  contenedor: { flex: 1, flexDirection: 'row', padding: 2 },
  opcion: { flex: 1, alignItems: 'center', paddingVertical: 7, paddingHorizontal: 2 },
  // La opción elegida flota apenas sobre el riel, como el control segmentado de iOS
  activa: { boxShadow: '0 3px 8px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.04)' },
});
