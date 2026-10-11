import { StyleSheet, View } from 'react-native';
import { useTema } from '@/theme';
import { Presionable } from './Presionable';
import { Texto } from './Texto';

type Opcion<T extends string> = { valor: T; etiqueta: string; conteo?: number };

// Selector de filtros mutuamente excluyentes (Todos / Pendientes / Vencidos...)
export function Segmentos<T extends string>({ opciones, valor, onCambio }: { opciones: Opcion<T>[]; valor: T; onCambio: (v: T) => void }) {
  const { color, radio } = useTema();
  return (
    <View
      accessibilityRole="tablist"
      style={[estilos.contenedor, { backgroundColor: color.borde, borderRadius: radio.m }]}
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
            style={[estilos.opcion, { borderRadius: radio.s }, activo && { backgroundColor: color.superficie }]}
          >
            <Texto
              variante="detalle"
              numberOfLines={1}
              style={{ color: activo ? color.texto : color.textoSuave, fontFamily: activo ? 'Figtree_700Bold' : 'Figtree_500Medium' }}
            >
              {o.etiqueta}
              {o.conteo ? ` ${o.conteo}` : ''}
            </Texto>
          </Presionable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexDirection: 'row', padding: 3 },
  opcion: { flex: 1, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
});
