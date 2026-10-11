import { CircleCheck, Clock, TriangleAlert, WifiOff } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerMensualidades, pagarMensualidad, type Mensualidad } from '@/api/endpoints';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { IconoFiltro, IconoPagos } from '@/components/iconos/Iconly';
import { Segmentos } from '@/components/Segmentos';
import {
  Buscador,
  Encabezado,
  EstadoVacio,
  Fila,
  formatoMoneda,
  Grupo,
  Hoja,
  Insignia,
  ItemGrupo,
  ParDato,
  Superficie,
  Texto,
  type TonoInsignia,
} from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema, type Tema } from '@/theme';
import { useObjetivoTour } from '@/tour/Tour';
import { fechaCorta } from '@/utils/texto';
import { alerta } from '@/utils/alerta';

type Filtro = 'todos' | 'Pendiente' | 'Vencido' | 'Pagado';

const PRIORIDAD: Record<string, number> = { Vencido: 0, Pendiente: 1, Pagado: 2 };

const ESTADOS: Record<string, { tono: TonoInsignia; icono: typeof Clock; texto: string }> = {
  Pagado: { tono: 'exito', icono: CircleCheck, texto: 'Pagado' },
  Vencido: { tono: 'peligro', icono: TriangleAlert, texto: 'Vencido' },
  Pendiente: { tono: 'aviso', icono: Clock, texto: 'Pendiente' },
};

function coloresEstado(tono: TonoInsignia, color: Tema['color']) {
  if (tono === 'exito') return [color.exitoSuave, color.exito];
  if (tono === 'peligro') return [color.peligroSuave, color.peligro];
  return [color.avisoSuave, color.aviso];
}

export default function CobrosScreen() {
  const refTour = useObjetivoTour('cobros');
  const { color } = useTema();
  const { margen, maximo } = useDiseno();
  const espacioBarra = useEspacioBarra();
  const { datos, cargando, error, recargar } = useRecurso(obtenerMensualidades, [] as Mensualidad[]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [seleccionado, setSeleccionado] = useState<Mensualidad | null>(null);
  const [cobrando, setCobrando] = useState(false);

  const porCobrar = datos.filter((m) => m.estado !== 'Pagado').reduce((s, m) => s + m.monto, 0);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return datos
      .filter(
        (m) =>
          (filtro === 'todos' || m.estado === filtro) &&
          (!q || m.nombreAlumno.toLowerCase().includes(q) || m.claveKiosco.toLowerCase().includes(q)),
      )
      // Lo urgente primero: vencidos, luego pendientes, luego pagados
      .sort((a, b) => (PRIORIDAD[a.estado] ?? 1) - (PRIORIDAD[b.estado] ?? 1));
  }, [datos, busqueda, filtro]);

  async function cobrar(m: Mensualidad) {
    setCobrando(true);
    try {
      await pagarMensualidad(m.id);
      setSeleccionado(null);
      await recargar();
    } catch (e) {
      alerta('No se pudo registrar el pago', (e as Error).message);
    } finally {
      setCobrando(false);
    }
  }

  const vacio = error ? (
    <EstadoVacio icono={WifiOff} tono="error" titulo="No se pudieron cargar los recibos" mensaje={error} accion={{ titulo: 'Reintentar', onPress: recargar }} />
  ) : cargando ? null : busqueda || filtro !== 'todos' ? (
    <EstadoVacio icono={IconoFiltro} titulo="Sin recibos con ese filtro" mensaje="Prueba con otro estado o búsqueda." />
  ) : (
    <EstadoVacio icono={IconoPagos} titulo="Aún no hay recibos" mensaje="Cada inscripción genera su primer recibo automáticamente." />
  );

  const estadoSel = seleccionado ? ESTADOS[seleccionado.estado] ?? ESTADOS.Pendiente : null;
  const pagadoSel = seleccionado?.estado === 'Pagado';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.fondo }}>
      <FlatList
        data={filtrados}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[estilos.lista, { paddingHorizontal: margen, paddingBottom: espacioBarra, maxWidth: maximo + margen * 2 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} />}
        ListHeaderComponent={
          <View style={estilos.cabecera} ref={refTour} collapsable={false}>
            <Encabezado titulo="Cobros" detalle={porCobrar > 0 ? `${formatoMoneda(porCobrar)} por cobrar` : 'Todo cobrado'} />
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
          const [fondo, frente] = coloresEstado(estado.tono, color);
          const Icono = estado.icono;
          return (
            <ItemGrupo indice={index} total={filtrados.length}>
              <Fila
                titulo={item.nombreAlumno}
                detalle={item.estado === 'Pagado' ? `Pagado el ${fechaCorta(item.fechaPago)}` : `Vence el ${fechaCorta(item.fechaVencimiento)}`}
                izquierda={
                  <View style={[estilos.estado, { backgroundColor: fondo }]} accessibilityLabel={estado.texto}>
                    <Icono size={20} color={frente} />
                  </View>
                }
                derecha={
                  <Texto variante="cuerpoFuerte" cifras>
                    {formatoMoneda(item.monto)}
                  </Texto>
                }
                onPress={() => setSeleccionado(item)}
              />
            </ItemGrupo>
          );
        }}
      />

      <Hoja
        visible={!!seleccionado}
        titulo={seleccionado?.nombreAlumno ?? ''}
        descripcion={seleccionado ? `PIN ${seleccionado.claveKiosco}` : undefined}
        onCerrar={() => setSeleccionado(null)}
        accion={
          seleccionado && !pagadoSel
            ? { titulo: 'Registrar pago', onPress: () => cobrar(seleccionado), cargando: cobrando }
            : undefined
        }
      >
        {seleccionado && estadoSel && (
          <>
            <Superficie style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
              <Texto variante="cifra" cifras style={{ fontSize: 40, lineHeight: 46 }}>
                {formatoMoneda(seleccionado.monto)}
              </Texto>
              <Insignia texto={estadoSel.texto} tono={estadoSel.tono} icono={estadoSel.icono} />
            </Superficie>
            <Grupo>
              <ParDato etiqueta="Vence" valor={fechaCorta(seleccionado.fechaVencimiento)} />
              <ParDato etiqueta="Pagado" valor={pagadoSel ? fechaCorta(seleccionado.fechaPago) : 'Aún no'} />
              <ParDato etiqueta="Recibo" valor={`#${seleccionado.id.substring(0, 6).toUpperCase()}`} />
            </Grupo>
            {!pagadoSel && (
              <Texto variante="detalle" tono="suave">
                Al registrar el pago se suma a las finanzas del mes y el siguiente recibo aparece 7 días antes de su vencimiento.
              </Texto>
            )}
          </>
        )}
      </Hoja>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  lista: { width: '100%', alignSelf: 'center' },
  cabecera: { gap: 14, marginBottom: 16 },
  estado: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
