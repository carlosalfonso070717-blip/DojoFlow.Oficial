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
      {/* Riel en forma de píldora; la opción elegida es una cápsula de cristal que flota encima */}
      <View
        accessibilityRole="tablist"
        style={[
          estilos.contenedor,
          {
            backgroundColor: oscuro ? 'rgba(0,0,0,0.35)' : 'rgba(118,118,128,0.12)',
            borderColor: oscuro ? color.contorno : 'transparent',
            borderRadius: radio.total,
          },
        ]}
      >
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <Presionable
            key={o.valor}
            onPress={() => onCambio(o.valor)}
            escala={0.96}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            style={[
              estilos.opcion,
              { borderRadius: radio.total },
              activo && [estilos.activa, oscuro ? estilos.activaOscura : { backgroundColor: '#ffffff' }],
            ]}
          >
            <Texto
              variante="detalle"
              numberOfLines={1}
              style={{ fontSize: 13, color: activo ? color.texto : color.textoSuave, fontFamily: activo ? 'Inter_600SemiBold' : 'Inter_500Medium' }}
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
  contenedor: { flex: 1, flexDirection: 'row', padding: 3, borderWidth: StyleSheet.hairlineWidth },
  opcion: { flex: 1, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2 },
  // La opción elegida flota apenas sobre el riel, como el control segmentado de iOS
  activa: { boxShadow: '0 3px 8px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.04)' },
  activaOscura: {
    backgroundColor: 'rgba(255,255,255,0.11)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 14px -4px rgba(0,0,0,0.6)',
  },
});
