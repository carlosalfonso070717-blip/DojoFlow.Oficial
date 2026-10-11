import { router } from 'expo-router';
import { CircleCheck, Tablet, TriangleAlert } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerAlertasInventario, obtenerAlumnos, obtenerFinanzas, obtenerMensualidades } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { IconoAgregarAlumno, IconoAjustes, IconoPagos } from '@/components/iconos/Iconly';
import { Boton, BotonIcono, Credencial, DatoCredencial, Fila, formatoCorto, formatoMoneda, Grupo, Texto } from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';
import { useObjetivoTour, useTour } from '@/tour/Tour';
import { cantidad, plural, saludo } from '@/utils/texto';

// Mismo formato que guarda la API: "10-2026"
const mesActual = () => {
  const hoy = new Date();
  return `${String(hoy.getMonth() + 1).padStart(2, '0')}-${hoy.getFullYear()}`;
};

const cargarResumen = async () => {
  const [alumnos, recibos, finanzas, alertas] = await Promise.all([
    obtenerAlumnos(),
    obtenerMensualidades(),
    obtenerFinanzas(),
    obtenerAlertasInventario(),
  ]);
  const vencidos = recibos.filter((r) => r.estado === 'Vencido');
  const pendientes = recibos.filter((r) => r.estado === 'Pendiente');
  return {
    alumnos: alumnos.length,
    vencidos: { n: vencidos.length, monto: vencidos.reduce((s, r) => s + r.monto, 0) },
    pendientes: { n: pendientes.length, monto: pendientes.reduce((s, r) => s + r.monto, 0) },
    ingresosMes: finanzas.find((f) => f.mesAnio === mesActual())?.total ?? 0,
    alertasStock: alertas.length,
  };
};

const VACIO = { alumnos: 0, vencidos: { n: 0, monto: 0 }, pendientes: { n: 0, monto: 0 }, ingresosMes: 0, alertasStock: 0 };

export default function InicioScreen() {
  const { color } = useTema();
  const { margen, esTableta } = useDiseno();
  const espacioBarra = useEspacioBarra();
  const { perfil, vincularKiosco } = useSesion();
  const { iniciar: iniciarTour } = useTour();
  const { datos, cargando, recargar, error } = useRecurso(cargarResumen, VACIO);

  const refCredencial = useObjetivoTour('credencial');
  const refPendiente = useObjetivoTour('pendiente');
  const refInscribir = useObjetivoTour('inscribir');
  const refAjustes = useObjetivoTour('ajustes');

  // La primera vez que alguien entra, el recorrido arranca solo (una vez por sesión)
  const tourLanzado = useRef(false);
  useEffect(() => {
    if (!perfil || perfil.usuario.tourCompletado || tourLanzado.current) return;
    tourLanzado.current = true;
    const t = setTimeout(iniciarTour, 900);
    return () => clearTimeout(t);
  }, [perfil, iniciarTour]);

  if (!perfil) return null;
  const { academia, usuario } = perfil;
  const termino = academia.terminoAlumno || 'Alumno';
  const todoAlDia = datos.vencidos.n === 0 && datos.pendientes.n === 0 && datos.alertasStock === 0;

  async function abrirKiosco() {
    try {
      await vincularKiosco();
      router.push('/kiosco');
    } catch (e) {
      Alert.alert('No se pudo abrir el kiosco', (e as Error).message);
    }
  }

  const pendiente = (
    <View ref={refPendiente} collapsable={false}>
      <Grupo titulo="Pendiente">
        {error ? (
          <Fila
            titulo="No se pudo cargar el resumen"
            detalle="Desliza hacia abajo para intentar de nuevo."
            izquierda={<TriangleAlert size={22} color={color.peligro} />}
          />
        ) : todoAlDia ? (
          <Fila titulo="Todo al día" detalle="Sin recibos por cobrar ni productos por resurtir." izquierda={<CircleCheck size={22} color={color.exito} />} />
        ) : null}
        {!error && datos.vencidos.n > 0 && (
          <Fila
            titulo={cantidad(datos.vencidos.n, 'recibo vencido', 'recibos vencidos')}
            detalle={`${formatoMoneda(datos.vencidos.monto)} sin pagar`}
            izquierda={<IconoPagos size={22} color={color.peligro} />}
            onPress={() => router.navigate('/mensualidades')}
          />
        )}
        {!error && datos.pendientes.n > 0 && (
          <Fila
            titulo={cantidad(datos.pendientes.n, 'recibo por cobrar', 'recibos por cobrar')}
            detalle={formatoMoneda(datos.pendientes.monto)}
            izquierda={<IconoPagos size={22} color={color.aviso} />}
            onPress={() => router.navigate('/mensualidades')}
          />
        )}
        {!error && datos.alertasStock > 0 && (
          <Fila
            titulo={`${cantidad(datos.alertasStock, 'producto', 'productos')} por resurtir`}
            detalle="Llegaron a su stock mínimo"
            izquierda={<TriangleAlert size={22} color={color.aviso} />}
            onPress={() => router.navigate('/inventario')}
          />
        )}
      </Grupo>
    </View>
  );

  const acciones = (
    <View style={{ gap: 10 }}>
      <View ref={refInscribir} collapsable={false}>
        <Boton titulo={`Inscribir ${termino.toLowerCase()}`} icono={IconoAgregarAlumno} onPress={() => router.push('/registrar')} />
      </View>
      <Boton titulo="Abrir kiosco" icono={Tablet} variante="tonal" onPress={abrirKiosco} />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScrollView
        contentContainerStyle={[estilos.contenido, { paddingHorizontal: margen, paddingBottom: espacioBarra, maxWidth: esTableta ? 1000 : 560 }]}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} />}
      >
        <View style={estilos.saludo}>
          <View style={{ flex: 1 }}>
            <Texto variante="detalle" tono="suave">
              {saludo()},
            </Texto>
            <Texto variante="encabezado">{usuario.nombre.split(' ')[0]}</Texto>
          </View>
          <View ref={refAjustes} collapsable={false}>
            <BotonIcono icono={<IconoAjustes size={22} color={color.texto} />} etiqueta="Ajustes" onPress={() => router.push('/ajustes')} />
          </View>
        </View>

        {/* En tableta: credencial a la izquierda, pendientes y acciones a la derecha */}
        <View style={esTableta ? estilos.columnas : { gap: 28 }}>
          <View ref={refCredencial} collapsable={false} style={esTableta ? { flex: 1.1 } : undefined}>
            <Credencial academia={academia}>
              <DatoCredencial valor={String(datos.alumnos)} etiqueta={plural(termino)} fondo={academia.colorSecundario} />
              <DatoCredencial valor={formatoCorto(datos.ingresosMes)} etiqueta="Ingresos del mes" fondo={academia.colorSecundario} />
            </Credencial>
          </View>
          <View style={[{ gap: 28 }, esTableta && { flex: 1 }]}>
            {pendiente}
            {acciones}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: 28, paddingTop: 8, width: '100%', alignSelf: 'center' },
  saludo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  columnas: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
});
