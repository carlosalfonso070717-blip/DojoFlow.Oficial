import { ChartColumn, Trash2, WifiOff } from 'lucide-react-native';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eliminarMesFinanzas, obtenerFinanzas, type RegistroFinanciero } from '@/api/endpoints';
import { confirmar, Encabezado, EstadoVacio, Fila, formatoMoneda, ItemGrupo, Superficie, Texto } from '@/components/ui';
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
  const { color, espacio, radio } = useTema();
  const { datos, cargando, error, recargar } = useRecurso(obtenerFinanzas, [] as RegistroFinanciero[]);
  // El primer registro del historial es el mes más reciente con movimientos
  const actual = datos[0];
  const total = actual?.total ?? 0;
  const parteCuotas = total > 0 ? (actual!.ingresosMensualidades / total) * 100 : 0;

  function borrarMes(mesAnio: string) {
    confirmar(`¿Borrar ${nombreMes(mesAnio)}?`, 'El historial de ese mes se eliminará de forma permanente.', 'Borrar', async () => {
      await eliminarMesFinanzas(mesAnio);
      recargar();
    });
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.fondo }}>
      <FlatList
        data={datos}
        keyExtractor={(f) => f.mesAnio}
        contentContainerStyle={{ padding: espacio.l, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} />}
        ListHeaderComponent={
          <View style={estilos.cabecera}>
            <Encabezado titulo="Finanzas" />

            {actual && (
              <Superficie style={{ gap: 16 }}>
                <View style={{ gap: 2 }}>
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
                  <Desglose
                    etiqueta={`Ventas (${actual.ventasRealizadas})`}
                    valor={actual.ingresosVentas}
                    colorPunto={color.marcaSuave}
                  />
                </View>
              </Superficie>
            )}

            {datos.length > 1 && (
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
            <EstadoVacio icono={ChartColumn} titulo="Aún no hay movimientos" mensaje="Los cobros y las ventas se suman aquí automáticamente." />
          )
        }
        // El mes actual ya se muestra arriba; la lista es el historial completo
        renderItem={({ item, index }) => (
          <ItemGrupo indice={index} total={datos.length}>
            <Fila
              titulo={nombreMes(item.mesAnio)}
              detalle={`Cuotas ${formatoMoneda(item.ingresosMensualidades)}, ventas ${formatoMoneda(item.ingresosVentas)}`}
              derecha={
                <View style={estilos.derecha}>
                  <Texto variante="cuerpoFuerte" cifras>
                    {formatoMoneda(item.total)}
                  </Texto>
                  <Pressable hitSlop={10} onPress={() => borrarMes(item.mesAnio)} accessibilityLabel={`Borrar ${nombreMes(item.mesAnio)}`}>
                    <Trash2 size={18} color={color.textoTenue} />
                  </Pressable>
                </View>
              }
            />
          </ItemGrupo>
        )}
      />
    </SafeAreaView>
  );
}

function Desglose({ etiqueta, valor, colorPunto }: { etiqueta: string; valor: number; colorPunto: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
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
  cabecera: { gap: 14, marginBottom: 8 },
  barra: { height: 10, flexDirection: 'row', overflow: 'hidden' },
  desglose: { flexDirection: 'row', gap: 16 },
  derecha: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
