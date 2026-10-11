import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronRight, CircleCheck, ClipboardCheck, Package, ShoppingCart, Tablet, TrendingDown, TrendingUp, TriangleAlert, Users } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  obtenerAlertasInventario,
  obtenerAlumnos,
  obtenerAsistencias,
  obtenerFinanzas,
  obtenerMensualidades,
  type MarcaAcademia,
  type RegistroFinanciero,
} from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { GraficaBarras } from '@/components/GraficaBarras';
import { IconoAgregarAlumno, IconoAjustes, IconoPagos } from '@/components/iconos/Iconly';
import { IconoTonal, Indicador, Rejilla, Tarjeta, TarjetaAccion, TituloSeccion, useSombra } from '@/components/Tarjetas';
import { Avatar, Boton, Fila, formatoCorto, formatoMoneda, Grupo, Presionable, Texto } from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { useRecurso } from '@/hooks/useRecurso';
import { conAlfa, mezclar, textoSobre } from '@/theme/color';
import { useTema } from '@/theme';
import { useObjetivoTour, useTour } from '@/tour/Tour';
import { cantidad, plural } from '@/utils/texto';
import { alerta } from '@/utils/alerta';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_GRAFICA = 6;

// Mismo formato que guarda la API: "10-2026"
const claveMes = (fecha: Date) => `${String(fecha.getMonth() + 1).padStart(2, '0')}-${fecha.getFullYear()}`;

type Mes = { clave: string; corto: string; largo: string; total: number; cuotas: number; ventas: number; nVentas: number };

// Los últimos meses, del más viejo al actual; los meses sin movimientos valen 0
function mesesRecientes(finanzas: RegistroFinanciero[]): Mes[] {
  const hoy = new Date();
  return Array.from({ length: MESES_GRAFICA }, (_, i) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (MESES_GRAFICA - 1 - i), 1);
    const nombre = MESES[fecha.getMonth()];
    const registro = finanzas.find((f) => f.mesAnio === claveMes(fecha));
    return {
      clave: claveMes(fecha),
      corto: nombre.slice(0, 3),
      largo: nombre[0].toUpperCase() + nombre.slice(1),
      total: registro?.total ?? 0,
      cuotas: registro?.ingresosMensualidades ?? 0,
      ventas: registro?.ingresosVentas ?? 0,
      nVentas: registro?.ventasRealizadas ?? 0,
    };
  });
}

const cargarResumen = async () => {
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const [alumnos, recibos, finanzas, alertas, asistencias] = await Promise.all([
    obtenerAlumnos(),
    obtenerMensualidades(),
    obtenerFinanzas(),
    obtenerAlertasInventario(),
    // Si la academia no usa el registrador, simplemente no hay registros
    obtenerAsistencias(inicioHoy, new Date()).catch(() => []),
  ]);
  const vencidos = recibos.filter((r) => r.estado === 'Vencido');
  const pendientes = recibos.filter((r) => r.estado === 'Pendiente');
  return {
    alumnos: alumnos.length,
    vencidos: { n: vencidos.length, monto: vencidos.reduce((s, r) => s + r.monto, 0) },
    pendientes: { n: pendientes.length, monto: pendientes.reduce((s, r) => s + r.monto, 0) },
    meses: mesesRecientes(finanzas),
    alertasStock: alertas.length,
    asistenciasHoy: asistencias.length,
  };
};

type Resumen = Awaited<ReturnType<typeof cargarResumen>>;

const VACIO: Resumen = {
  alumnos: 0,
  vencidos: { n: 0, monto: 0 },
  pendientes: { n: 0, monto: 0 },
  meses: mesesRecientes([]),
  alertasStock: 0,
  asistenciasHoy: 0,
};

// Alto de la cabecera flotante del celular (sin el área segura) y su aire superior
const ALTO_CABECERA = 60;
const AIRE_SUPERIOR = 14;

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
  const { academia } = perfil;
  const termino = academia.terminoAlumno || 'Alumno';
  const todoAlDia = datos.vencidos.n === 0 && datos.pendientes.n === 0 && datos.alertasStock === 0;
  const porCobrar = datos.vencidos.monto + datos.pendientes.monto;

  async function abrirRegistrador() {
    try {
      await vincularKiosco();
      router.push('/kiosco');
    } catch (e) {
      alerta('No se pudo abrir el registrador de asistencias', (e as Error).message);
    }
  }

  const ingresos = (
    <View ref={refCredencial} collapsable={false}>
      <TarjetaIngresos academia={academia} meses={datos.meses} />
    </View>
  );

  // Resumen del negocio: lo que importa de un vistazo, cada tarjeta lleva a su sección
  const indicadores = (
    <View ref={refPendiente} collapsable={false} style={{ gap: 12 }}>
      {!esEscritorio && <TituloSeccion titulo="Resumen" />}
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
          detalle={datos.vencidos.n > 0 ? `${formatoCorto(datos.vencidos.monto)} sin pagar` : 'Nadie atrasado'}
          onPress={() => router.navigate('/mensualidades')}
        />
        <Indicador
          icono={Package}
          tono={datos.alertasStock > 0 ? 'aviso' : 'neutro'}
          etiqueta="Por resurtir"
          valor={String(datos.alertasStock)}
          detalle={datos.alertasStock > 0 ? 'Llegaron a su mínimo' : 'Todo surtido'}
          onPress={() => router.navigate('/inventario')}
        />
      </Rejilla>
    </View>
  );

  // Solo para quienes usan el registrador de asistencias
  const asistencias = academia.asistenciasActivas && (
    <Tarjeta onPress={() => router.push('/asistencias')} etiqueta="Ver reporte de asistencias">
      <View style={estilos.estadoTarjeta}>
        <IconoTonal icono={ClipboardCheck} tono="exito" />
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="cuerpoFuerte">{cantidad(datos.asistenciasHoy, 'asistencia hoy', 'asistencias hoy')}</Texto>
          <Texto variante="detalle" tono="suave">
            Ver el reporte de asistencias
          </Texto>
        </View>
        <ChevronRight size={18} color={color.textoTenue} />
      </View>
    </Tarjeta>
  );

  // ===== Escritorio: tablero en dos columnas =====
  if (esEscritorio) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: color.fondo }}
        contentContainerStyle={[estilos.contenido, { paddingHorizontal: margen, paddingTop: arriba, paddingBottom: espacioBarra, maxWidth: 1240 }]}
      >
        <View style={estilos.cabeceraEscritorio}>
          <LogoAcademia academia={academia} tamano={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="titulo" numberOfLines={1}>
              {academia.nombre}
            </Texto>
            <Texto variante="detalle" tono="suave">
              {academia.tipoNegocio}
            </Texto>
          </View>
          {academia.asistenciasActivas && (
            <Boton titulo="Registrador de asistencias" icono={Tablet} variante="contorno" tamano="compacto" onPress={abrirRegistrador} />
          )}
          <View ref={refInscribir} collapsable={false}>
            <Boton titulo={`Inscribir ${termino.toLowerCase()}`} icono={IconoAgregarAlumno} tamano="compacto" onPress={() => router.push('/registrar')} />
          </View>
        </View>

        {indicadores}

        <View style={estilos.columnas}>
          <View style={{ flex: 1.35 }}>{ingresos}</View>
          <View style={{ flex: 1, gap: 24 }}>
            <View style={{ gap: 10 }}>
              <TituloSeccion titulo="Acciones rápidas" />
              <Rejilla columnas={2}>
                <TarjetaAccion icono={IconoPagos} titulo="Cobrar" detalle="Registra un pago pendiente" onPress={() => router.navigate('/mensualidades')} />
                <TarjetaAccion icono={ShoppingCart} titulo="Vender" detalle="Descuenta una pieza del inventario" onPress={() => router.navigate('/inventario')} />
              </Rejilla>
            </View>
            {asistencias}
            <Pendientes datos={datos} error={!!error} todoAlDia={todoAlDia} />
          </View>
        </View>
      </ScrollView>
    );
  }

  // ===== Celular y tableta: la academia flota arriba; debajo, solo las tarjetas que importan =====
  const arribaCabecera = insets.top + AIRE_SUPERIOR;
  const arribaContenido = arribaCabecera + ALTO_CABECERA + 20;
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
        {ingresos}
        {indicadores}
        {asistencias}
      </ScrollView>

      <CabeceraFlotante
        academia={academia}
        alto={arribaCabecera + ALTO_CABECERA}
        top={arribaCabecera}
        margen={margen}
        ancho={esTableta ? 760 : 560}
        accion={
          <View ref={refAjustes} collapsable={false}>
            <BotonFlotante etiqueta="Ajustes" onPress={() => router.push('/ajustes')}>
              <IconoAjustes size={22} color={color.texto} />
            </BotonFlotante>
          </View>
        }
      />
    </View>
  );
}

// Logo con un aro fino del color de la academia
function LogoAcademia({ academia, tamano }: { academia: MarcaAcademia; tamano: number }) {
  return (
    <View style={[estilos.aro, { borderColor: academia.colorPrimario, borderRadius: tamano }]}>
      <Avatar nombre={academia.nombre} logoUrl={academia.logoUrl} tamano={tamano} />
    </View>
  );
}

// Logo, nombre y categoría flotando sobre el contenido, sin barra: solo un degradado
// del fondo detrás para que el texto se lea cuando las tarjetas pasan por debajo
function CabeceraFlotante({
  academia,
  alto,
  top,
  margen,
  ancho,
  accion,
}: {
  academia: MarcaAcademia;
  alto: number;
  top: number;
  margen: number;
  ancho: number;
  accion: ReactNode;
}) {
  const { color } = useTema();
  return (
    <View pointerEvents="box-none" style={[estilos.capaCabecera, { height: alto + 28 }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[color.fondo, conAlfa(color.fondo, 0.92), conAlfa(color.fondo, 0)]}
        locations={[0, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        entering={FadeInDown.duration(420).springify().damping(18)}
        style={[estilos.cabecera, { marginTop: top, paddingHorizontal: margen, maxWidth: ancho + margen * 2 }]}
      >
        <LogoAcademia academia={academia} tamano={46} />
        <View style={{ flex: 1, gap: 1 }}>
          <Texto variante="encabezado" numberOfLines={1} style={{ fontSize: 20, lineHeight: 24 }}>
            {academia.nombre}
          </Texto>
          <Texto variante="detalle" tono="suave" numberOfLines={1}>
            {academia.tipoNegocio}
          </Texto>
        </View>
        {accion}
      </Animated.View>
    </View>
  );
}

// Botón redondo que flota sobre el fondo (superficie con sombra suave)
function BotonFlotante({ etiqueta, onPress, children }: { etiqueta: string; onPress: () => void; children: ReactNode }) {
  const { color } = useTema();
  const sombra = useSombra();
  return (
    <Presionable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={[estilos.botonFlotante, { backgroundColor: color.superficie, borderColor: color.borde }, sombra]}
    >
      {children}
    </Presionable>
  );
}

function Pendientes({ datos, error, todoAlDia }: { datos: Resumen; error: boolean; todoAlDia: boolean }) {
  return (
    <View style={{ gap: 10 }}>
      <TituloSeccion titulo="Requiere atención" />
      {error || todoAlDia ? (
        <Tarjeta>
          <View style={estilos.estadoTarjeta}>
            <IconoTonal icono={error ? TriangleAlert : CircleCheck} tono={error ? 'peligro' : 'exito'} />
            <View style={{ flex: 1, gap: 2 }}>
              <Texto variante="cuerpoFuerte">{error ? 'No se pudo cargar el resumen' : 'Todo al día'}</Texto>
              <Texto variante="detalle" tono="suave">
                {error ? 'Vuelve a abrir Inicio para intentar de nuevo.' : 'Sin recibos por cobrar ni productos por resurtir.'}
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
}

// Tarjeta protagonista con los colores de la academia: los ingresos del mes elegido,
// su comparación con el anterior, la gráfica de los últimos meses y el desglose
function TarjetaIngresos({ academia, meses }: { academia: MarcaAcademia; meses: Mes[] }) {
  const { radio } = useTema();
  const sombra = useSombra('alta');
  const [elegido, setElegido] = useState(meses.length - 1);
  const base = academia.colorSecundario;
  const tinta = textoSobre(base, '#14161a');
  const claro = tinta === '#ffffff';
  const tintaSuave = claro ? 'rgba(255,255,255,0.72)' : 'rgba(20,22,26,0.62)';
  const pista = claro ? 'rgba(255,255,255,0.16)' : 'rgba(20,22,26,0.1)';

  const indice = Math.min(elegido, meses.length - 1);
  const mes = meses[indice];
  const anterior = meses[indice - 1];
  const cambio = anterior && anterior.total > 0 ? ((mes.total - anterior.total) / anterior.total) * 100 : null;
  const enCurso = indice === meses.length - 1;

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

        <View style={estilos.filaIngresos}>
          <View style={{ flex: 1, gap: 4 }}>
            <Texto variante="detalle" style={{ color: tintaSuave }}>
              Ingresos de {mes.largo.toLowerCase()}
              {enCurso ? ' · en curso' : ''}
            </Texto>
            <Texto variante="gigante" cifras numberOfLines={1} adjustsFontSizeToFit style={{ color: tinta }}>
              {formatoMoneda(mes.total)}
            </Texto>
          </View>
          {cambio !== null && (
            <View style={[estilos.cambio, { backgroundColor: pista }]}>
              {cambio >= 0 ? <TrendingUp size={13} color={tinta} strokeWidth={2.4} /> : <TrendingDown size={13} color={tinta} strokeWidth={2.4} />}
              <Texto variante="pequeno" cifras style={{ color: tinta, fontFamily: 'Figtree_700Bold' }}>
                {cambio >= 0 ? '+' : ''}
                {Math.round(cambio)}% vs {anterior.corto}
              </Texto>
            </View>
          )}
        </View>

        <GraficaBarras
          datos={meses.map((m) => ({ clave: m.clave, etiqueta: m.corto, valor: m.total, descripcion: `${m.largo}: ${formatoMoneda(m.total)}` }))}
          elegido={indice}
          onElegir={setElegido}
          alto={112}
          formatoGuia={formatoCorto}
          mensajeVacio="Aquí verás cómo crecen tus ingresos"
          colores={{
            activo: tinta,
            inactivo: claro ? 'rgba(255,255,255,0.28)' : 'rgba(20,22,26,0.22)',
            vacio: pista,
            guia: pista,
            base: pista,
            etiqueta: tintaSuave,
            etiquetaActiva: tinta,
            fondo: 'transparent',
          }}
        />

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Parte etiqueta="Cuotas" valor={mes.cuotas} punto={academia.colorPrimario} tinta={tinta} suave={tintaSuave} />
          <Parte etiqueta={`Ventas (${mes.nVentas})`} valor={mes.ventas} punto={pista} tinta={tinta} suave={tintaSuave} />
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
  capaCabecera: { position: 'absolute', left: 0, right: 0, top: 0 },
  cabecera: { width: '100%', height: ALTO_CABECERA, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 12 },
  aro: { borderWidth: 2, padding: 2 },
  botonFlotante: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  ingresos: { padding: 22, gap: 18, overflow: 'hidden' },
  filaIngresos: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cambio: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  estadoTarjeta: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
