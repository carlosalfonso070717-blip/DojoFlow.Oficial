import { CircleCheck, Clock, SearchX, TriangleAlert, WifiOff } from 'lucide-react-native';
import { IconoFiltro, IconoPagos } from '@/components/iconos/Iconly';
import { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerMensualidades, pagarMensualidad, type Mensualidad } from '@/api/endpoints';
import {
  Boton,
  Buscador,
  confirmar,
  Encabezado,
  EstadoVacio,
  Fila,
  formatoMoneda,
  Insignia,
  ItemGrupo,
  Texto,
  type TonoInsignia,
} from '@/components/ui';
import { Segmentos } from '@/components/Segmentos';
import { useRecurso } from '@/hooks/useRecurso';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { useTema } from '@/theme';

type Filtro = 'todos' | 'Pendiente' | 'Vencido' | 'Pagado';

const ESTADOS: Record<string, { tono: TonoInsignia; icono: typeof Clock; texto: string }> = {
  Pagado: { tono: 'exito', icono: CircleCheck, texto: 'Pagado' },
  Vencido: { tono: 'peligro', icono: TriangleAlert, texto: 'Vencido' },
  Pendiente: { tono: 'aviso', icono: Clock, texto: 'Pendiente' },
};

export default function CobrosScreen() {
  const espacioBarra = useEspacioBarra();
  const { color, espacio } = useTema();
  const { datos, cargando, error, recargar } = useRecurso(obtenerMensualidades, [] as Mensualidad[]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [cobrando, setCobrando] = useState<string | null>(null);

  const porCobrar = datos.filter((m) => m.estado !== 'Pagado').reduce((s, m) => s + m.monto, 0);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return datos.filter(
      (m) =>
        (filtro === 'todos' || m.estado === filtro) &&
        (!q || m.nombreAlumno.toLowerCase().includes(q) || m.claveKiosco.toLowerCase().includes(q)),
    );
  }, [datos, busqueda, filtro]);

  function cobrar(m: Mensualidad) {
    confirmar(
      `Cobrar ${formatoMoneda(m.monto)}`,
      `Se registrará el pago de ${m.nombreAlumno} y se sumará a las finanzas del mes.`,
      'Registrar pago',
      async () => {
        setCobrando(m.id);
        try {
          await pagarMensualidad(m.id);
          await recargar();
        } catch (e) {
          Alert.alert('No se pudo registrar el pago', (e as Error).message);
        } finally {
          setCobrando(null);
        }
      },
      false,
    );
  }

  const vacio = error ? (
    <EstadoVacio icono={WifiOff} tono="error" titulo="No se pudieron cargar los recibos" mensaje={error} accion={{ titulo: 'Reintentar', onPress: recargar }} />
  ) : cargando ? null : busqueda || filtro !== 'todos' ? (
    <EstadoVacio icono={IconoFiltro} titulo="Sin recibos con ese filtro" mensaje="Prueba con otro estado o búsqueda." />
  ) : (
    <EstadoVacio icono={IconoPagos} titulo="Aún no hay recibos" mensaje="Cada inscripción genera su primer recibo automáticamente." />
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.fondo }}>
      <FlatList
        data={filtrados}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: espacio.l, paddingBottom: espacioBarra }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} />}
        ListHeaderComponent={
          <View style={estilos.cabecera}>
            <Encabezado titulo="Cobros" detalle={porCobrar > 0 ? `${formatoMoneda(porCobrar)} por cobrar` : undefined} />
            <Segmentos<Filtro>
              icono={IconoFiltro}
              valor={filtro}
              onCambio={setFiltro}
              opciones={[
                { valor: 'todos', etiqueta: 'Todos' },
                { valor: 'Vencido', etiqueta: 'Vencidos' },
                { valor: 'Pendiente', etiqueta: 'Pendientes' },
                { valor: 'Pagado', etiqueta: 'Pagados' },
              ]}
            />
            {datos.length > 0 && <Buscador value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre o PIN" />}
          </View>
        }
        ListEmptyComponent={vacio}
        renderItem={({ item, index }) => {
          const estado = ESTADOS[item.estado] ?? ESTADOS.Pendiente;
          const pagado = item.estado === 'Pagado';
          return (
            <ItemGrupo indice={index} total={filtrados.length}>
              <Fila
                titulo={item.nombreAlumno}
                detalle={pagado ? `Pagado el ${item.fechaPago}` : `Vence el ${item.fechaVencimiento}`}
                alinearArriba
                derecha={
                  <Texto variante="subtitulo" cifras>
                    {formatoMoneda(item.monto)}
                  </Texto>
                }
              >
                <View style={estilos.pie}>
                  <Insignia texto={estado.texto} tono={estado.tono} icono={estado.icono} />
                  {!pagado && (
                    <Boton
                      titulo="Registrar pago"
                      tamano="compacto"
                      variante={item.estado === 'Vencido' ? 'primario' : 'contorno'}
                      cargando={cobrando === item.id}
                      onPress={() => cobrar(item)}
                    />
                  )}
                </View>
              </Fila>
            </ItemGrupo>
          );
        }}
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  cabecera: { gap: 14, marginBottom: 16 },
  pie: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 },
});
