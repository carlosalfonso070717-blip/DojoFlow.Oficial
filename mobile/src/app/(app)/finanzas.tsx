import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { eliminarMesFinanzas, obtenerFinanzas, type RegistroFinanciero } from '@/api/endpoints';
import { Badge, confirmar, formatoMoneda, Tarjeta, TextoVacio } from '@/components/ui';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';

export default function FinanzasScreen() {
  const tema = useTema();
  const { datos, cargando, error, recargar } = useRecurso(obtenerFinanzas, [] as RegistroFinanciero[]);
  // Igual que la web: el resumen superior muestra el primer registro del historial
  const actual = datos[0];

  function borrarMes(mesAnio: string) {
    confirmar('¿Borrar historial?', `Mes ${mesAnio}. Esto es permanente.`, 'Borrar', async () => {
      await eliminarMesFinanzas(mesAnio);
      recargar();
    });
  }

  return (
    <FlatList
      data={datos}
      keyExtractor={(f) => f.mesAnio}
      contentContainerStyle={estilos.lista}
      refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={tema.primary} />}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <View style={estilos.resumen}>
            <Resumen etiqueta="Mensualidades" valor={actual?.ingresosMensualidades ?? 0} />
            <Resumen etiqueta="Ventas" valor={actual?.ingresosVentas ?? 0} />
          </View>
          <Tarjeta style={{ backgroundColor: tema.primary, borderColor: tema.primary }}>
            <Text style={{ color: '#ffffffcc', fontWeight: '600' }}>
              Utilidad total {actual ? `· ${actual.mesAnio}` : ''}
            </Text>
            <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>{formatoMoneda(actual?.total ?? 0)}</Text>
          </Tarjeta>
          <Text style={[estilos.subtitulo, { color: tema.textMuted }]}>Historial por mes</Text>
        </View>
      }
      ListEmptyComponent={<TextoVacio error={error} cargando={cargando} texto="Aún no hay registros financieros." />}
      renderItem={({ item }) => (
        <Tarjeta style={{ gap: 10 }}>
          <View style={estilos.fila}>
            <Text style={[estilos.mes, { color: tema.text }]}>📅 {item.mesAnio}</Text>
            <Badge texto={`${item.ventasRealizadas} arts.`} color={tema.textMuted} />
            <Pressable hitSlop={10} onPress={() => borrarMes(item.mesAnio)}>
              <Text style={{ fontSize: 18, color: tema.primary }}>🗑</Text>
            </Pressable>
          </View>
          <View style={estilos.fila}>
            <Linea etiqueta="Mensualidades" valor={item.ingresosMensualidades} />
            <Linea etiqueta="Ventas" valor={item.ingresosVentas} />
            <Linea etiqueta="Total" valor={item.total} destacado />
          </View>
        </Tarjeta>
      )}
    />
  );
}

function Resumen({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  const tema = useTema();
  return (
    <Tarjeta style={{ flex: 1 }}>
      <Text style={{ color: tema.textMuted, fontWeight: '600' }}>{etiqueta}</Text>
      <Text style={{ color: tema.text, fontSize: 20, fontWeight: '800' }}>{formatoMoneda(valor)}</Text>
    </Tarjeta>
  );
}

function Linea({ etiqueta, valor, destacado }: { etiqueta: string; valor: number; destacado?: boolean }) {
  const tema = useTema();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: tema.textMuted, fontSize: 12 }}>{etiqueta}</Text>
      <Text style={{ color: destacado ? tema.success : tema.text, fontWeight: destacado ? '800' : '500' }}>
        {formatoMoneda(valor)}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 16, gap: 12 },
  resumen: { flexDirection: 'row', gap: 12 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mes: { fontSize: 17, fontWeight: '700', flex: 1 },
  subtitulo: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
});
