import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { CircleCheck, Package, ShoppingCart, Tablet, TriangleAlert, Users } from 'lucide-react-native';
import { useEffect, useRef, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { obtenerAlertasInventario, obtenerAlumnos, obtenerFinanzas, obtenerMensualidades, type MarcaAcademia, type RegistroFinanciero } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { GraficaIngresos, type MesGrafica } from '@/components/GraficaIngresos';
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

// Los últimos meses, del más viejo al actual; los meses sin movimientos valen 0
function mesesRecientes(finanzas: RegistroFinanciero[]): MesGrafica[] {
  const hoy = new Date();
  return Array.from({ length: MESES_GRAFICA }, (_, i) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (MESES_GRAFICA - 1 - i), 1);
    const nombre = MESES[fecha.getMonth()];
    return {
      clave: claveMes(fecha),
      corto: nombre.slice(0, 3),
      largo: nombre[0].toUpperCase() + nombre.slice(1),
      valor: finanzas.find((f) => f.mesAnio === claveMes(fecha))?.total ?? 0,
    };
  });
}

const cargarResumen = async () => {
  const [alumnos, recibos, finanzas, alertas] = await Promise.all([
    obtenerAlumnos(),
    obtenerMensualidades(),
    obtenerFinanzas(),
    obtenerAlertasInventario(),
  ]);
  const vencidos = recibos.filter((r) => r.estado === 'Vencido');
  const pendientes = recibos.filter((r) => r.estado === 'Pendiente');
  const mes = finanzas.find((f) => f.mesAnio === claveMes(new Date()));
  return {
    alumnos: alumnos.length,
    vencidos: { n: vencidos.length, monto: vencidos.reduce((s, r) => s + r.monto, 0) },
    pendientes: { n: pendientes.length, monto: pendientes.reduce((s, r) => s + r.monto, 0) },
    ingresos: { total: mes?.total ?? 0, cuotas: mes?.ingresosMensualidades ?? 0, ventas: mes?.ingresosVentas ?? 0, nVentas: mes?.ventasRealizadas ?? 0 },
    meses: mesesRecientes(finanzas),
    alertasStock: alertas.length,
  };
};

type Resumen = Awaited<ReturnType<typeof cargarResumen>>;

const VACIO: Resumen = {
  alumnos: 0,
  vencidos: { n: 0, monto: 0 },
  pendientes: { n: 0, monto: 0 },
  ingresos: { total: 0, cuotas: 0, ventas: 0, nVentas: 0 },
  meses: [],
  alertasStock: 0,
};

// Alto de la cabecera flotante del celular (sin el área segura)
const ALTO_CABECERA = 60;

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

  const grafica = datos.meses.length > 0 && (
    <Animated.View entering={FadeInDown.duration(420).delay(120)}>
      <GraficaIngresos meses={datos.meses} />
    </Animated.View>
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
          <Boton titulo="Abrir kiosco" icono={Tablet} variante="contorno" tamano="compacto" onPress={abrirKiosco} />
          <View ref={refInscribir} collapsable={false}>
            <Boton titulo={`Inscribir ${termino.toLowerCase()}`} icono={IconoAgregarAlumno} tamano="compacto" onPress={() => router.push('/registrar')} />
          </View>
        </View>

        {indicadores}

        <View style={estilos.columnas}>
          <View style={{ flex: 1.35, gap: 24 }}>
            {ingresos}
            {grafica}
          </View>
          <View style={{ flex: 1, gap: 24 }}>
            <View style={{ gap: 10 }}>
              <TituloSeccion titulo="Acciones rápidas" />
              <Rejilla columnas={2}>
                <TarjetaAccion icono={IconoPagos} titulo="Cobrar" detalle="Registra un pago pendiente" onPress={() => router.navigate('/mensualidades')} />
                <TarjetaAccion icono={ShoppingCart} titulo="Vender" detalle="Descuenta una pieza del inventario" onPress={() => router.navigate('/inventario')} />
              </Rejilla>
            </View>
            <Pendientes datos={datos} error={!!error} todoAlDia={todoAlDia} />
          </View>
        </View>
      </ScrollView>
    );
  }

  // ===== Celular y tableta: la academia flota arriba; debajo, solo las tarjetas que importan =====
  const arribaContenido = insets.top + ALTO_CABECERA + 22;
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
        {grafica}
        {indicadores}
      </ScrollView>

      <CabeceraFlotante
        academia={academia}
        alto={insets.top + ALTO_CABECERA}
        top={insets.top}
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
  capaCabecera: { position: 'absolute', left: 0, right: 0, top: 0 },
  cabecera: { width: '100%', height: ALTO_CABECERA, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 12 },
  aro: { borderWidth: 2, padding: 2 },
  botonFlotante: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  ingresos: { padding: 22, gap: 18, overflow: 'hidden' },
  barra: { height: 8, borderRadius: 999, flexDirection: 'row', overflow: 'hidden' },
  estadoTarjeta: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
