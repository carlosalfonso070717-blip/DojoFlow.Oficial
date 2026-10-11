import { WifiOff } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eliminarMesFinanzas, obtenerFinanzas, type RegistroFinanciero } from '@/api/endpoints';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { IconoEliminar, IconoFinanzas } from '@/components/iconos/Iconly';
import { Boton, confirmar, Encabezado, EstadoVacio, Fila, formatoMoneda, Grupo, Hoja, ItemGrupo, ParDato, Superficie, Texto } from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// "10-2026" → "Octubre 2026"
function nombreMes(mesAnio: string) {
  const [mes, anio] = mesAnio.split('-');
  const nombre = MESES[parseInt(mes, 10) - 1];
  return nombre ? `${nombre[0].toUpperCase()}${nombre.slice(1)} ${anio}` : mesAnio;
}

export default function FinanzasScreen() {
  const { color, radio } = useTema();
  const { margen, maximo } = useDiseno();
  const espacioBarra = useEspacioBarra();
  const { datos, cargando, error, recargar } = useRecurso(obtenerFinanzas, [] as RegistroFinanciero[]);
  const [seleccionado, setSeleccionado] = useState<RegistroFinanciero | null>(null);
  // El primer registro del historial es el mes más reciente con movimientos
  const actual = datos[0];
  const total = actual?.total ?? 0;
  const parteCuotas = total > 0 ? (actual!.ingresosMensualidades / total) * 100 : 0;

  function borrarMes(mesAnio: string) {
    confirmar(`¿Borrar ${nombreMes(mesAnio)}?`, 'El historial de ese mes se eliminará de forma permanente.', 'Borrar', async () => {
      await eliminarMesFinanzas(mesAnio);
      setSeleccionado(null);
      recargar();
    });
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.fondo }}>
      <FlatList
        data={datos}
        keyExtractor={(f) => f.mesAnio}
        contentContainerStyle={[estilos.lista, { paddingHorizontal: margen, paddingBottom: espacioBarra, maxWidth: maximo + margen * 2 }]}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} />}
        ListHeaderComponent={
          <View style={estilos.cabecera}>
            <Encabezado titulo="Finanzas" />

            {actual && (
              <Superficie style={{ gap: 20, padding: 20 }}>
                <View style={{ gap: 4 }}>
                  <Texto variante="detalle" tono="suave">
                    Ingresos de {nombreMes(actual.mesAnio).toLowerCase()}
                  </Texto>
                  <Texto variante="cifra" cifras>
                    {formatoMoneda(total)}
                  </Texto>
                </View>

                {/* Proporción entre cuotas y ventas en una sola barra */}
                <View style={[estilos.barra, { backgroundColor: color.marcaSuave, borderRadius: radio.total }]}>
                  <View style={{ width: `${parteCuotas}%`, backgroundColor: color.marca, borderRadius: radio.total }} />
                </View>

                <View style={estilos.desglose}>
                  <Desglose etiqueta="Cuotas" valor={actual.ingresosMensualidades} colorPunto={color.marca} />
                  <Desglose etiqueta={`Ventas (${actual.ventasRealizadas})`} valor={actual.ingresosVentas} colorPunto={color.marcaSuave} />
                </View>
              </Superficie>
            )}

            {datos.length > 0 && (
              <Texto variante="detalle" tono="suave" style={{ paddingHorizontal: 4, marginTop: 8 }}>
                Historial
              </Texto>
            )}
          </View>
        }
        ListEmptyComponent={
          error ? (
            <EstadoVacio icono={WifiOff} tono="error" titulo="No se pudieron cargar las finanzas" mensaje={error} accion={{ titulo: 'Reintentar', onPress: recargar }} />
          ) : cargando ? null : (
            <EstadoVacio icono={IconoFinanzas} titulo="Aún no hay movimientos" mensaje="Los cobros y las ventas se suman aquí automáticamente." />
          )
        }
        renderItem={({ item, index }) => (
          <ItemGrupo indice={index} total={datos.length}>
            <Fila
              titulo={nombreMes(item.mesAnio)}
              detalle={`${item.ventasRealizadas} ${item.ventasRealizadas === 1 ? 'venta' : 'ventas'}`}
              derecha={
                <Texto variante="cuerpoFuerte" cifras>
                  {formatoMoneda(item.total)}
                </Texto>
              }
              onPress={() => setSeleccionado(item)}
            />
          </ItemGrupo>
        )}
      />

      <Hoja visible={!!seleccionado} titulo={seleccionado ? nombreMes(seleccionado.mesAnio) : ''} onCerrar={() => setSeleccionado(null)}>
        {seleccionado && (
          <>
            <Grupo>
              <ParDato etiqueta="Cuotas cobradas" valor={formatoMoneda(seleccionado.ingresosMensualidades)} />
              <ParDato etiqueta={`Ventas (${seleccionado.ventasRealizadas})`} valor={formatoMoneda(seleccionado.ingresosVentas)} />
              <ParDato etiqueta="Total" valor={formatoMoneda(seleccionado.total)} />
            </Grupo>
            <Boton titulo="Borrar este mes" icono={IconoEliminar} variante="peligro" onPress={() => borrarMes(seleccionado.mesAnio)} />
          </>
        )}
      </Hoja>
    </SafeAreaView>
  );
}

function Desglose({ etiqueta, valor, colorPunto }: { etiqueta: string; valor: number; colorPunto: string }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colorPunto }} />
        <Texto variante="detalle" tono="suave">
          {etiqueta}
        </Texto>
      </View>
      <Texto variante="subtitulo" cifras>
        {formatoMoneda(valor)}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { width: '100%', alignSelf: 'center' },
  cabecera: { gap: 14, marginBottom: 8 },
  barra: { height: 10, flexDirection: 'row', overflow: 'hidden' },
  desglose: { flexDirection: 'row', gap: 16 },
});
