import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { CircleCheck, Package, ShoppingCart, Tablet, TriangleAlert, Users } from 'lucide-react-native';
import { useEffect, useRef, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { obtenerAlertasInventario, obtenerAlumnos, obtenerFinanzas, obtenerMensualidades, type MarcaAcademia } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { IconoAgregarAlumno, IconoAjustes, IconoPagos } from '@/components/iconos/Iconly';
import { IconoTonal, Indicador, Rejilla, Tarjeta, TarjetaAccion, TituloSeccion, useSombra } from '@/components/Tarjetas';
import { Avatar, Boton, BotonIcono, Fila, formatoCorto, formatoMoneda, Grupo, Texto } from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { useRecurso } from '@/hooks/useRecurso';
import { conAlfa, mezclar, textoSobre } from '@/theme/color';
import { useTema } from '@/theme';
import { useObjetivoTour, useTour } from '@/tour/Tour';
import { cantidad, plural, saludo } from '@/utils/texto';
import { alerta } from '@/utils/alerta';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

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
  const mes = finanzas.find((f) => f.mesAnio === mesActual());
  return {
    alumnos: alumnos.length,
    vencidos: { n: vencidos.length, monto: vencidos.reduce((s, r) => s + r.monto, 0) },
    pendientes: { n: pendientes.length, monto: pendientes.reduce((s, r) => s + r.monto, 0) },
    ingresos: { total: mes?.total ?? 0, cuotas: mes?.ingresosMensualidades ?? 0, ventas: mes?.ingresosVentas ?? 0, nVentas: mes?.ventasRealizadas ?? 0 },
    alertasStock: alertas.length,
  };
};

type Resumen = Awaited<ReturnType<typeof cargarResumen>>;

const VACIO: Resumen = {
  alumnos: 0,
  vencidos: { n: 0, monto: 0 },
  pendientes: { n: 0, monto: 0 },
  ingresos: { total: 0, cuotas: 0, ventas: 0, nVentas: 0 },
  alertasStock: 0,
};

// Alto de la cabecera flotante del celular (sin el área segura)
const ALTO_CABECERA = 64;

export default function InicioScreen() {
  const { color } = useTema();
  const insets = useSafeAreaInsets();
  const { margen, esTableta, esEscritorio, arriba } = useDiseno();
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
  const porCobrar = datos.vencidos.monto + datos.pendientes.monto;

  async function abrirKiosco() {
    try {
      await vincularKiosco();
      router.push('/kiosco');
    } catch (e) {
      alerta('No se pudo abrir el kiosco', (e as Error).message);
    }
  }

  const ingresos = (
    <View ref={refCredencial} collapsable={false}>
      <TarjetaIngresos academia={academia} ingresos={datos.ingresos} />
    </View>
  );

  const indicadores = (
    <Rejilla columnas={esEscritorio || esTableta ? 4 : 2}>
      <Indicador icono={Users} etiqueta={plural(termino)} valor={String(datos.alumnos)} detalle="Inscritos" onPress={() => router.navigate('/alumnos')} />
      <Indicador
        icono={IconoPagos}
        tono="aviso"
        etiqueta="Por cobrar"
        valor={formatoCorto(porCobrar)}
        detalle={cantidad(datos.pendientes.n + datos.vencidos.n, 'recibo', 'recibos')}
        onPress={() => router.navigate('/mensualidades')}
      />
      <Indicador
        icono={TriangleAlert}
        tono={datos.vencidos.n > 0 ? 'peligro' : 'exito'}
        etiqueta="Vencidos"
        valor={String(datos.vencidos.n)}
        detalle={datos.vencidos.n > 0 ? `${formatoMoneda(datos.vencidos.monto)} sin pagar` : 'Nadie atrasado'}
        onPress={() => router.navigate('/mensualidades')}
      />
      <Indicador
        icono={Package}
        tono={datos.alertasStock > 0 ? 'aviso' : 'neutro'}
        etiqueta="Por resurtir"
        valor={String(datos.alertasStock)}
        detalle={datos.alertasStock > 0 ? 'Llegaron a su mínimo' : 'Inventario completo'}
        onPress={() => router.navigate('/inventario')}
      />
    </Rejilla>
  );

  const pendiente = (
    <View ref={refPendiente} collapsable={false} style={{ gap: 10 }}>
      <TituloSeccion titulo="Requiere atención" />
      {error ? (
        <Tarjeta>
          <View style={estilos.estadoTarjeta}>
            <IconoTonal icono={TriangleAlert} tono="peligro" />
            <View style={{ flex: 1, gap: 2 }}>
              <Texto variante="cuerpoFuerte">No se pudo cargar el resumen</Texto>
              <Texto variante="detalle" tono="suave">
                Desliza hacia abajo para intentar de nuevo.
              </Texto>
            </View>
          </View>
        </Tarjeta>
      ) : todoAlDia ? (
        <Tarjeta>
          <View style={estilos.estadoTarjeta}>
            <IconoTonal icono={CircleCheck} tono="exito" />
            <View style={{ flex: 1, gap: 2 }}>
              <Texto variante="cuerpoFuerte">Todo al día</Texto>
              <Texto variante="detalle" tono="suave">
                Sin recibos por cobrar ni productos por resurtir.
              </Texto>
            </View>
          </View>
        </Tarjeta>
      ) : (
        <Grupo>
          {datos.vencidos.n > 0 && (
            <Fila
              titulo={cantidad(datos.vencidos.n, 'recibo vencido', 'recibos vencidos')}
              detalle={`${formatoMoneda(datos.vencidos.monto)} sin pagar`}
              izquierda={<IconoTonal icono={IconoPagos} tono="peligro" tamano={36} />}
              onPress={() => router.navigate('/mensualidades')}
            />
          )}
          {datos.pendientes.n > 0 && (
            <Fila
              titulo={cantidad(datos.pendientes.n, 'recibo por cobrar', 'recibos por cobrar')}
              detalle={formatoMoneda(datos.pendientes.monto)}
              izquierda={<IconoTonal icono={IconoPagos} tono="aviso" tamano={36} />}
              onPress={() => router.navigate('/mensualidades')}
            />
          )}
          {datos.alertasStock > 0 && (
            <Fila
              titulo={`${cantidad(datos.alertasStock, 'producto', 'productos')} por resurtir`}
              detalle="Llegaron a su stock mínimo"
              izquierda={<IconoTonal icono={Package} tono="aviso" tamano={36} />}
              onPress={() => router.navigate('/inventario')}
            />
          )}
        </Grupo>
      )}
    </View>
  );

  const acciones = (
    <View style={{ gap: 10 }}>
      <TituloSeccion titulo="Acciones rápidas" />
      <Rejilla columnas={2}>
        <View ref={refInscribir} collapsable={false} style={{ flex: 1 }}>
          <TarjetaAccion
            destacada
            icono={IconoAgregarAlumno}
            titulo={`Inscribir ${termino.toLowerCase()}`}
            detalle="Genera su PIN y su primer recibo"
            onPress={() => router.push('/registrar')}
          />
        </View>
        <TarjetaAccion icono={Tablet} titulo="Abrir kiosco" detalle="Asistencia con PIN en recepción" onPress={abrirKiosco} />
        <TarjetaAccion icono={IconoPagos} titulo="Cobrar" detalle="Registra un pago pendiente" onPress={() => router.navigate('/mensualidades')} />
        <TarjetaAccion icono={ShoppingCart} titulo="Vender" detalle="Descuenta una pieza del inventario" onPress={() => router.navigate('/inventario')} />
      </Rejilla>
    </View>
  );

  const nombre = usuario.nombre.split(' ')[0];

  // ===== Escritorio: tablero en dos columnas =====
  if (esEscritorio) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: color.fondo }}
        contentContainerStyle={[estilos.contenido, { paddingHorizontal: margen, paddingTop: arriba, paddingBottom: espacioBarra, maxWidth: 1240 }]}
      >
        <View style={estilos.cabeceraEscritorio}>
          <Avatar nombre={academia.nombre} logoUrl={academia.logoUrl} tamano={60} />
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="titulo" numberOfLines={1}>
              {academia.nombre}
            </Texto>
            <Texto variante="detalle" tono="suave">
              {academia.tipoNegocio} · {saludo()}, {nombre}
            </Texto>
          </View>
          <Boton titulo="Abrir kiosco" icono={Tablet} variante="contorno" tamano="compacto" onPress={abrirKiosco} />
          <Boton titulo={`Inscribir ${termino.toLowerCase()}`} icono={IconoAgregarAlumno} tamano="compacto" onPress={() => router.push('/registrar')} />
        </View>

        {indicadores}

        <View style={estilos.columnas}>
          <View style={{ flex: 1.35, gap: 28 }}>
            {ingresos}
            {pendiente}
          </View>
          <View style={{ flex: 1 }}>{acciones}</View>
        </View>
      </ScrollView>
    );
  }

  // ===== Celular y tableta: cabecera flotante con la academia y tarjetas debajo =====
  const arribaContenido = insets.top + 12 + ALTO_CABECERA + 20;
  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScrollView
        contentContainerStyle={[
          estilos.contenido,
          { paddingHorizontal: margen, paddingTop: arribaContenido, paddingBottom: espacioBarra, maxWidth: esTableta ? 760 : 560 },
        ]}
        scrollIndicatorInsets={{ top: arribaContenido - insets.top }}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} progressViewOffset={arribaContenido} />}
      >
        <Animated.View entering={FadeInDown.duration(380)} style={{ gap: 2 }}>
          <Texto variante="detalle" tono="suave">
            {saludo()},
          </Texto>
          <Texto variante="titulo">{nombre}</Texto>
        </Animated.View>

        {ingresos}
        {indicadores}
        {pendiente}
        {acciones}
      </ScrollView>

      {/* El área de la barra de estado se tiñe del fondo para que el contenido no se lea detrás */}
      <View pointerEvents="none" style={[estilos.velo, { height: insets.top + 6, backgroundColor: color.fondo }]} />
      <CabeceraFlotante
        academia={academia}
        top={insets.top + 8}
        margen={Math.max(margen - 6, 12)}
        ancho={esTableta ? 760 : 560}
        accion={
          <View ref={refAjustes} collapsable={false}>
            <BotonIcono icono={<IconoAjustes size={22} color={color.texto} />} etiqueta="Ajustes" onPress={() => router.push('/ajustes')} />
          </View>
        }
      />
    </View>
  );
}

// Cápsula fija arriba con el logo, el nombre del negocio y su categoría
function CabeceraFlotante({ academia, top, margen, ancho, accion }: { academia: MarcaAcademia; top: number; margen: number; ancho: number; accion: ReactNode }) {
  const { color, radio, oscuro } = useTema();
  const sombra = useSombra('alta');
  return (
    <View pointerEvents="box-none" style={[estilos.capaCabecera, { top, paddingHorizontal: margen }]}>
      <Animated.View
        entering={FadeInDown.duration(420).springify().damping(18)}
        style={[
          estilos.cabecera,
          {
            maxWidth: ancho,
            borderRadius: radio.xl,
            backgroundColor: oscuro ? color.superficieElevada : color.superficie,
            borderColor: color.borde,
          },
          sombra,
        ]}
      >
        <Avatar nombre={academia.nombre} logoUrl={academia.logoUrl} tamano={44} />
        <View style={{ flex: 1, gap: 1 }}>
          <Texto variante="cuerpoFuerte" numberOfLines={1} style={{ fontSize: 17 }}>
            {academia.nombre}
          </Texto>
          <Texto variante="pequeno" tono="suave" numberOfLines={1}>
            {academia.tipoNegocio}
          </Texto>
        </View>
        {accion}
      </Animated.View>
    </View>
  );
}

// Tarjeta protagonista: ingresos del mes con los colores de la academia
function TarjetaIngresos({ academia, ingresos }: { academia: MarcaAcademia; ingresos: Resumen['ingresos'] }) {
  const { radio } = useTema();
  const sombra = useSombra('alta');
  const base = academia.colorSecundario;
  const tinta = textoSobre(base, '#14161a');
  const claro = tinta === '#ffffff';
  const tintaSuave = claro ? 'rgba(255,255,255,0.72)' : 'rgba(20,22,26,0.62)';
  const pista = claro ? 'rgba(255,255,255,0.16)' : 'rgba(20,22,26,0.1)';
  const parteCuotas = ingresos.total > 0 ? (ingresos.cuotas / ingresos.total) * 100 : 0;
  const mes = MESES[new Date().getMonth()];

  return (
    <Animated.View entering={FadeInDown.duration(420).delay(60).springify().damping(18)} style={[{ borderRadius: radio.xl }, sombra]}>
      <LinearGradient
        colors={[mezclar(base, academia.colorPrimario, 0.28), base]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[estilos.ingresos, { borderRadius: radio.xl }]}
      >
        {/* Brillo del color principal que se desvanece desde la esquina */}
        <LinearGradient
          pointerEvents="none"
          colors={[conAlfa(academia.colorPrimario, 0.45), conAlfa(academia.colorPrimario, 0)]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.35, y: 0.75 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={{ gap: 4 }}>
          <Texto variante="detalle" style={{ color: tintaSuave }}>
            Ingresos de {mes}
          </Texto>
          <Texto variante="gigante" cifras numberOfLines={1} adjustsFontSizeToFit style={{ color: tinta }}>
            {formatoMoneda(ingresos.total)}
          </Texto>
        </View>

        <View style={[estilos.barra, { backgroundColor: pista }]}>
          <View style={{ width: `${parteCuotas}%`, backgroundColor: academia.colorPrimario, borderRadius: 999 }} />
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Parte etiqueta="Cuotas" valor={ingresos.cuotas} punto={academia.colorPrimario} tinta={tinta} suave={tintaSuave} />
          <Parte etiqueta={`Ventas (${ingresos.nVentas})`} valor={ingresos.ventas} punto={pista} tinta={tinta} suave={tintaSuave} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function Parte({ etiqueta, valor, punto, tinta, suave }: { etiqueta: string; valor: number; punto: string; tinta: string; suave: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: punto }} />
        <Texto variante="pequeno" style={{ color: suave }}>
          {etiqueta}
        </Texto>
      </View>
      <Texto variante="subtitulo" cifras style={{ color: tinta }}>
        {formatoMoneda(valor)}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: 24, width: '100%', alignSelf: 'center' },
  columnas: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  cabeceraEscritorio: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  capaCabecera: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  cabecera: {
    width: '100%',
    height: ALTO_CABECERA,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 10,
    paddingRight: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  velo: { position: 'absolute', left: 0, right: 0, top: 0 },
  ingresos: { padding: 22, gap: 18, overflow: 'hidden' },
  barra: { height: 8, borderRadius: 999, flexDirection: 'row', overflow: 'hidden' },
  estadoTarjeta: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
