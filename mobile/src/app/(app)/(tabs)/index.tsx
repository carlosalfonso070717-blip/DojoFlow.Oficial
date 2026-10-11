import { router } from 'expo-router';
import { CircleCheck, Tablet, TriangleAlert, Wallet } from 'lucide-react-native';
import { IconoAgregarAlumno, IconoAjustes, IconoCerrarSesion } from '@/components/iconos/Iconly';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  obtenerAlertasInventario,
  obtenerAlumnos,
  obtenerFinanzas,
  obtenerMensualidades,
} from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import {
  BotonIcono,
  Credencial,
  DatoCredencial,
  Fila,
  formatoCorto,
  formatoMoneda,
  Grupo,
  Hoja,
  Boton,
  Texto,
} from '@/components/ui';
import { useRecurso } from '@/hooks/useRecurso';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { useTema } from '@/theme';
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

const VACIO = {
  alumnos: 0,
  vencidos: { n: 0, monto: 0 },
  pendientes: { n: 0, monto: 0 },
  ingresosMes: 0,
  alertasStock: 0,
};

export default function InicioScreen() {
  const espacioBarra = useEspacioBarra();
  const { color, espacio } = useTema();
  const { perfil, cerrarSesion, vincularKiosco } = useSesion();
  const { datos, cargando, recargar, error } = useRecurso(cargarResumen, VACIO);
  const [opciones, setOpciones] = useState(false);

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

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScrollView
        contentContainerStyle={[estilos.contenido, { padding: espacio.l, paddingBottom: espacioBarra }]}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} />}
      >
        <View style={estilos.saludo}>
          <View style={{ flex: 1 }}>
            <Texto variante="detalle" tono="suave">
              {saludo()},
            </Texto>
            <Texto variante="subtitulo">{usuario.nombre.split(' ')[0]}</Texto>
          </View>
          <BotonIcono icono={<IconoAjustes size={22} color={color.texto} />} etiqueta="Ajustes" onPress={() => setOpciones(true)} />
        </View>

        <Credencial academia={academia}>
          <DatoCredencial valor={String(datos.alumnos)} etiqueta={plural(termino)} fondo={academia.colorSecundario} />
          <DatoCredencial valor={formatoCorto(datos.ingresosMes)} etiqueta="Ingresos del mes" fondo={academia.colorSecundario} />
        </Credencial>

        <Grupo titulo="Pendiente">
          {error ? (
            <Fila
              titulo="No se pudo cargar el resumen"
              detalle="Desliza hacia abajo para intentar de nuevo."
              izquierda={<TriangleAlert size={22} color={color.peligro} />}
            />
          ) : todoAlDia ? (
            <Fila
              titulo="Todo al día"
              detalle="Sin recibos por cobrar ni productos por resurtir."
              izquierda={<CircleCheck size={22} color={color.exito} />}
            />
          ) : null}
          {!error && datos.vencidos.n > 0 && (
            <Fila
              titulo={`${cantidad(datos.vencidos.n, 'recibo vencido', 'recibos vencidos')}`}
              detalle={`${formatoMoneda(datos.vencidos.monto)} sin pagar`}
              izquierda={<Wallet size={22} color={color.peligro} />}
              onPress={() => router.navigate('/mensualidades')}
            />
          )}
          {!error && datos.pendientes.n > 0 && (
            <Fila
              titulo={`${cantidad(datos.pendientes.n, 'recibo por cobrar', 'recibos por cobrar')}`}
              detalle={formatoMoneda(datos.pendientes.monto)}
              izquierda={<Wallet size={22} color={color.aviso} />}
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

        <View style={estilos.acciones}>
          <Boton titulo={`Inscribir ${termino.toLowerCase()}`} icono={IconoAgregarAlumno} onPress={() => router.push('/registrar')} />
          <Boton titulo="Abrir kiosco" icono={Tablet} variante="tonal" onPress={abrirKiosco} />
        </View>
      </ScrollView>

      <Hoja visible={opciones} titulo={academia.nombre} descripcion={usuario.email} onCerrar={() => setOpciones(false)}>
        <Grupo>
          <Fila
            titulo="Abrir kiosco"
            detalle="Vincula esta tablet para registrar asistencias"
            izquierda={<Tablet size={22} color={color.marcaTexto} />}
            onPress={() => {
              setOpciones(false);
              abrirKiosco();
            }}
          />
          <Fila
            titulo="Cerrar sesión"
            izquierda={<IconoCerrarSesion size={22} color={color.peligro} />}
            onPress={() => {
              setOpciones(false);
              cerrarSesion();
            }}
          />
        </Grupo>
      </Hoja>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: 24 },
  saludo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  acciones: { gap: 10 },
});
