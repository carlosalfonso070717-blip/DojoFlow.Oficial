import { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { obtenerMensualidades, pagarMensualidad, type Mensualidad } from '@/api/endpoints';
import { Badge, Boton, Buscador, confirmar, formatoMoneda, Tarjeta, TextoVacio } from '@/components/ui';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema, type Tema } from '@/theme';

const FILTROS = ['Todos', 'Pendiente', 'Vencido', 'Pagado'] as const;

function colorEstado(estado: string, tema: Tema) {
  if (estado === 'Pagado') return tema.success;
  if (estado === 'Vencido') return tema.primary;
  return '#d4a017';
}

export default function MensualidadesScreen() {
  const tema = useTema();
  const { datos, cargando, error, recargar } = useRecurso(obtenerMensualidades, [] as Mensualidad[]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>('Todos');

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return datos.filter(
      (m) =>
        (filtro === 'Todos' || m.estado === filtro) &&
        (!q || m.nombreAlumno.toLowerCase().includes(q) || m.claveKiosco.toLowerCase().includes(q)),
    );
  }, [datos, busqueda, filtro]);

  function cobrar(m: Mensualidad) {
    confirmar(
      'Registrar cobro',
      `¿Confirmas la recepción de ${formatoMoneda(m.monto)} de ${m.nombreAlumno}?`,
      'Sí, cobrar',
      async () => {
        await pagarMensualidad(m.id);
        Alert.alert('Listo', 'Pago registrado exitosamente');
        recargar();
      },
      false,
    );
  }

  return (
    <FlatList
      data={filtrados}
      keyExtractor={(m) => m.id}
      contentContainerStyle={estilos.lista}
      refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={tema.primary} />}
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          <Buscador value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre o PIN..." />
          <View style={estilos.filtros}>
            {FILTROS.map((f) => {
              const activo = filtro === f;
              return (
                <Text
                  key={f}
                  onPress={() => setFiltro(f)}
                  style={[
                    estilos.filtro,
                    { borderColor: tema.border, color: activo ? '#fff' : tema.text },
                    activo && { backgroundColor: tema.primary, borderColor: tema.primary },
                  ]}
                >
                  {f}
                </Text>
              );
            })}
          </View>
        </View>
      }
      ListEmptyComponent={<TextoVacio error={error} cargando={cargando} texto="No hay recibos." />}
      renderItem={({ item }) => (
        <Tarjeta style={{ gap: 10 }}>
          <View style={estilos.fila}>
            <View style={{ flex: 1 }}>
              <Text style={[estilos.nombre, { color: tema.text }]}>{item.nombreAlumno}</Text>
              <Text style={{ color: tema.textMuted, fontFamily: 'monospace' }}>
                PIN {item.claveKiosco} · #{item.id.substring(0, 6)}
              </Text>
            </View>
            <Badge texto={item.estado} color={colorEstado(item.estado, tema)} />
          </View>

          <View style={estilos.fila}>
            <Dato etiqueta="Monto" valor={formatoMoneda(item.monto)} destacado />
            <Dato etiqueta="Vence" valor={item.fechaVencimiento} />
            <Dato etiqueta="Pagado" valor={item.fechaPago} />
          </View>

          {item.estado !== 'Pagado' && <Boton titulo="Registrar pago" onPress={() => cobrar(item)} />}
        </Tarjeta>
      )}
    />
  );
}

function Dato({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  const tema = useTema();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: tema.textMuted, fontSize: 12 }}>{etiqueta}</Text>
      <Text style={{ color: tema.text, fontWeight: destacado ? '800' : '500' }}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 16, gap: 12 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nombre: { fontSize: 17, fontWeight: '700' },
  filtros: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filtro: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    overflow: 'hidden',
    fontWeight: '600',
  },
});
