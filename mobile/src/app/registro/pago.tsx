import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Check, CreditCard, FlaskConical, Lock, ShieldCheck } from 'lucide-react-native';
import { Children, forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { FadeIn, interpolate, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { Confeti } from '@/components/Confeti';
import { Cristal } from '@/components/Cristal';
import { Tarjeta, useSombra, Vidrio } from '@/components/Tarjetas';
import { formatoMoneda, Insignia, Texto } from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro } from '@/onboarding/RegistroContexto';
import { fechaRenovacion, precioDe } from '@/suscripciones/catalogo';
import { pasarela, TARJETAS_PRUEBA } from '@/suscripciones/pasarela';
import { contratarPlan } from '@/suscripciones/servicio';
import { formatearNumero, formatearVencimiento, largoCvv, marcaDe, soloDigitos, validarTarjeta } from '@/suscripciones/tarjeta';
import type { DatosTarjeta, MarcaTarjeta } from '@/suscripciones/tipos';
import { ProveedorTema, useTema } from '@/theme';
import { mezclar, textoSobre } from '@/theme/color';

const VACIA: DatosTarjeta = { titular: '', numero: '', vencimiento: '', cvv: '' };
// Lo que dura la celebración antes de pasar a la pantalla final
const CELEBRACION = 2800;

export default function PasoPago() {
  const { borrador } = useRegistro();
  return (
    <ProveedorTema marca={{ primario: borrador.colorPrimario, secundario: borrador.colorSecundario }}>
      <Pago />
    </ProveedorTema>
  );
}

function Pago() {
  const { color } = useTema();
  const { ancho } = useDiseno();
  const { eleccion, token, borrador, setSuscripcion } = useRegistro();
  const [tarjeta, setTarjeta] = useState<DatosTarjeta>({ ...VACIA, titular: borrador.nombre.trim() });
  const [intento, setIntento] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [rechazo, setRechazo] = useState<string | null>(null);
  const [aprobado, setAprobado] = useState(false);
  const [reverso, setReverso] = useState(false);
  const refNumero = useRef<TextInput>(null);
  const refVence = useRef<TextInput>(null);
  const refCvv = useRef<TextInput>(null);

  // Si se recarga la página sin plan elegido, vuelve a los planes
  useEffect(() => {
    if (!eleccion) router.replace('/registro/planes');
  }, [eleccion]);

  if (!eleccion) return null;
  const { plan, periodo } = eleccion;
  const dosColumnas = ancho >= 900;
  const monto = precioDe(plan, periodo);
  const marca = marcaDe(tarjeta.numero);
  const errores = intento ? validarTarjeta(tarjeta) : {};

  const cambiar = (campo: keyof DatosTarjeta, valor: string) => {
    setRechazo(null);
    setTarjeta((t) => ({ ...t, [campo]: valor }));
  };

  async function pagar() {
    setIntento(true);
    setRechazo(null);
    if (Object.keys(validarTarjeta(tarjeta)).length > 0) return;
    setProcesando(true);
    try {
      const suscripcion = await contratarPlan({ tokenAcademia: token, plan, periodo, tarjeta });
      setSuscripcion(suscripcion);
      setAprobado(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => router.replace('/registro/listo'), CELEBRACION);
    } catch (e) {
      setRechazo((e as Error).message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setProcesando(false);
    }
  }

  const llenarPrueba = () => {
    setRechazo(null);
    setTarjeta((t) => ({ titular: t.titular || 'Titular de prueba', numero: TARJETAS_PRUEBA.aprobada, vencimiento: '12/30', cvv: '123' }));
  };

  // Columna del pedido: la tarjeta en vivo y lo que se va a pagar
  const pedido = (
    <View style={estilos.columna}>
      <TarjetaVisual datos={tarjeta} marca={marca} reverso={reverso} />
      <Tarjeta style={estilos.resumen}>
        <View style={estilos.filaResumen}>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="pequeno" tono="tenue" style={estilos.rotulo}>
              Tu plan
            </Texto>
            <Texto variante="encabezado" numberOfLines={1}>
              {plan.nombre}
            </Texto>
          </View>
          <Insignia tono="marca" texto={periodo === 'anual' ? 'Anual' : 'Mensual'} />
        </View>
        <View style={[estilos.separador, { backgroundColor: color.borde }]} />
        <LineaResumen etiqueta="Subtotal" valor={formatoMoneda(monto)} />
        <LineaResumen etiqueta="Siguiente cobro" valor={fechaCorta(fechaRenovacion(periodo))} />
        <View style={[estilos.separador, { backgroundColor: color.borde }]} />
        <View style={estilos.filaTotal}>
          <Texto variante="cuerpoFuerte">Total hoy</Texto>
          <Texto variante="cifra" cifras animada style={{ fontSize: 28, lineHeight: 32 }}>
            {`${formatoMoneda(monto)}`}
          </Texto>
        </View>
        <Texto variante="pequeno" tono="tenue" style={{ textAlign: 'right' }}>
          {plan.moneda} · IVA incluido · Cancela cuando quieras
        </Texto>
      </Tarjeta>
    </View>
  );

  // Columna del método de pago: modo de prueba, formulario agrupado y tarjetas aceptadas
  const metodo = (
    <View style={estilos.columna}>
      {pasarela.modoPrueba && (
        <View style={[estilos.prueba, { backgroundColor: color.avisoSuave }]}>
          <FlaskConical size={16} color={color.aviso} />
          <Texto variante="pequeno" style={{ flex: 1, color: color.aviso, fontFamily: 'Inter_600SemiBold' }}>
            {/* En celular solo el rótulo, para que quepa en una línea junto al enlace */}
            {dosColumnas ? 'Modo de prueba · sin cargos' : 'Modo de prueba'}
          </Texto>
          <Pressable onPress={llenarPrueba} hitSlop={8} accessibilityRole="button" accessibilityLabel="Usar tarjeta de prueba">
            <Texto variante="pequeno" style={{ color: color.texto, fontFamily: 'Inter_700Bold', textDecorationLine: 'underline' }}>
              Usar tarjeta de prueba
            </Texto>
          </Pressable>
        </View>
      )}

      <View style={{ gap: 8 }}>
        <Texto variante="pequeno" tono="suave" style={[estilos.rotulo, { paddingHorizontal: 4 }]}>
          Método de pago
        </Texto>
        <GrupoFormulario>
          <CampoTarjeta
            ref={refNumero}
            etiqueta="Número de tarjeta"
            valor={tarjeta.numero}
            onCambio={(v) => {
              const formateado = formatearNumero(v);
              cambiar('numero', formateado);
              if (soloDigitos(formateado).length === (marcaDe(formateado) === 'amex' ? 15 : 16)) refVence.current?.focus();
            }}
            placeholder="1234 5678 9012 3456"
            teclado="number-pad"
            autoComplete="cc-number"
            error={errores.numero}
            derecha={<LogoMarca marca={marca} />}
          />
          <View style={estilos.filaPartida}>
            <View style={{ flex: 1 }}>
              <CampoTarjeta
                ref={refVence}
                etiqueta="Vencimiento"
                valor={tarjeta.vencimiento}
                onCambio={(v) => {
                  const formateado = formatearVencimiento(v);
                  cambiar('vencimiento', formateado);
                  if (formateado.length === 5) refCvv.current?.focus();
                }}
                placeholder="MM/AA"
                teclado="number-pad"
                autoComplete="cc-exp"
                error={errores.vencimiento}
              />
            </View>
            <View style={[estilos.divisor, { backgroundColor: color.borde }]} />
            <View style={{ flex: 1 }}>
              <CampoTarjeta
                ref={refCvv}
                etiqueta="CVV"
                valor={tarjeta.cvv}
                onCambio={(v) => cambiar('cvv', soloDigitos(v).slice(0, largoCvv(marca)))}
                onFocus={() => setReverso(true)}
                onBlur={() => setReverso(false)}
                placeholder={marca === 'amex' ? '1234' : '123'}
                teclado="number-pad"
                autoComplete="cc-csc"
                error={errores.cvv}
                derecha={<Lock size={16} color={color.textoTenue} />}
              />
            </View>
          </View>
          <CampoTarjeta
            etiqueta="Nombre en la tarjeta"
            valor={tarjeta.titular}
            onCambio={(v) => cambiar('titular', v)}
            placeholder="Como aparece en la tarjeta"
            mayusculas
            autoComplete="cc-name"
            error={errores.titular}
          />
        </GrupoFormulario>
      </View>

      <View style={estilos.aceptadas}>
        <Texto variante="pequeno" tono="tenue">
          Aceptamos
        </Texto>
        <LogoMarca marca="visa" />
        <LogoMarca marca="mastercard" />
        <LogoMarca marca="amex" />
        <View style={{ flex: 1 }} />
        <ShieldCheck size={14} color={color.exito} />
        <Texto variante="pequeno" tono="tenue">
          Pago seguro
        </Texto>
      </View>

      {/* En escritorio, lo que incluye el plan acompaña al formulario y equilibra las dos columnas */}
      {dosColumnas && (
        <Tarjeta style={estilos.incluye}>
          <Texto variante="pequeno" tono="tenue" style={estilos.rotulo}>
            Incluye
          </Texto>
          {plan.beneficios.map((b) => (
            <View key={b} style={estilos.beneficio}>
              <View style={[estilos.palomitaBeneficio, { backgroundColor: color.marcaSuave }]}>
                <Check size={12} color={color.marcaTexto} strokeWidth={3} />
              </View>
              <Texto variante="detalle" style={{ flex: 1 }}>
                {b}
              </Texto>
            </View>
          ))}
        </Tarjeta>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <PantallaPaso
        paso="pago"
        anchoMaximo={dosColumnas ? 960 : 560}
        titulo="Datos de pago"
        descripcion={`Activa ${plan.nombre} para ${borrador.nombreAcademia.trim() || 'tu academia'}.`}
        // Siempre "Pagar" y el monto: mientras se procesa, el mismo botón muestra que está trabajando
        continuar={{ titulo: `Pagar ${formatoMoneda(monto)}`, onPress: pagar, cargando: procesando, deshabilitado: aprobado }}
        nota={
          // El rechazo se avisa junto al botón: es lo que se está viendo al pagar
          rechazo ? (
            <Animated.View entering={FadeIn.duration(200)} style={estilos.nota} accessibilityLiveRegion="polite">
              <Texto variante="detalle" tono="peligro" style={{ textAlign: 'center' }}>
                {rechazo}
              </Texto>
            </Animated.View>
          ) : (
            <View style={estilos.nota}>
              <Lock size={12} color={color.textoTenue} />
              <Texto variante="pequeno" tono="tenue">
                Pago cifrado. No guardamos los datos de tu tarjeta.
              </Texto>
            </View>
          )
        }
      >
        {dosColumnas ? (
          <View style={estilos.columnas}>
            <View style={{ flex: 1 }}>{pedido}</View>
            <View style={{ flex: 1.1 }}>{metodo}</View>
          </View>
        ) : (
          <>
            {pedido}
            {metodo}
          </>
        )}
      </PantallaPaso>

      {aprobado && <Celebracion plan={plan.nombre} />}
    </View>
  );
}

// "1 dic 2026": cabe en una línea junto a su etiqueta, también en celulares angostos
const fechaCorta = (fecha: Date) => fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');

// Renglón del resumen: etiqueta a la izquierda y monto a la derecha, al ras del contenido de la tarjeta
function LineaResumen({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={estilos.filaTotal}>
      <Texto variante="detalle" tono="suave">
        {etiqueta}
      </Texto>
      <Texto variante="cuerpoFuerte" cifras numberOfLines={1}>
        {valor}
      </Texto>
    </View>
  );
}

// Formulario agrupado al estilo iOS: una sola superficie de cristal con los campos en filas
function GrupoFormulario({ children }: { children: ReactNode }) {
  const { color, radio } = useTema();
  const sombra = useSombra();
  const hijos = Children.toArray(children);
  return (
    <View style={[estilos.grupo, { backgroundColor: color.superficie, borderColor: color.contorno, borderTopColor: color.contornoLuz, borderRadius: radio.l + 2 }, sombra]}>
      <Vidrio radio={radio.l + 1} />
      {hijos.map((hijo, i) => (
        <View key={i}>
          {i > 0 && <View style={[estilos.separador, { backgroundColor: color.borde, marginHorizontal: 0 }]} />}
          {hijo}
        </View>
      ))}
    </View>
  );
}

type PropsCampoTarjeta = {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  placeholder?: string;
  teclado?: 'number-pad' | 'default';
  autoComplete?: TextInputProps['autoComplete'];
  mayusculas?: boolean;
  error?: string;
  derecha?: ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
};

// Fila del formulario: rótulo pequeño arriba, el dato grande abajo; al enfocarla se tiñe de la marca
const CampoTarjeta = forwardRef<TextInput, PropsCampoTarjeta>(function CampoTarjeta(
  { etiqueta, valor, onCambio, placeholder, teclado = 'default', autoComplete, mayusculas, error, derecha, onFocus, onBlur },
  ref,
) {
  const { color, tipografia } = useTema();
  const [enfocado, setEnfocado] = useState(false);
  return (
    <View style={[estilos.campo, { backgroundColor: enfocado ? color.marcaSuave : 'transparent' }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <Texto variante="pequeno" style={{ color: error ? color.peligro : enfocado ? color.marcaTexto : color.textoTenue }}>
          {error ?? etiqueta}
        </Texto>
        <TextInput
          ref={ref}
          value={valor}
          onChangeText={onCambio}
          onFocus={() => {
            setEnfocado(true);
            onFocus?.();
          }}
          onBlur={() => {
            setEnfocado(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={color.textoTenue}
          selectionColor={color.marcaTexto}
          keyboardType={teclado}
          autoComplete={autoComplete}
          autoCapitalize={mayusculas ? 'characters' : 'none'}
          autoCorrect={false}
          accessibilityLabel={etiqueta}
          style={[tipografia.cuerpoFuerte, estilos.entrada, { color: color.texto }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
        />
      </View>
      {derecha}
    </View>
  );
});

// Logotipo de la red de la tarjeta, dibujado (sin imágenes externas)
function LogoMarca({ marca }: { marca: MarcaTarjeta }) {
  const { color } = useTema();
  if (marca === 'visa') {
    return (
      <View style={[estilos.logo, { backgroundColor: '#1a1f71' }]}>
        <Texto variante="pequeno" style={estilos.textoVisa}>
          VISA
        </Texto>
      </View>
    );
  }
  if (marca === 'mastercard') {
    return (
      <View style={[estilos.logo, { backgroundColor: '#14161a' }]}>
        <View style={[estilos.circulo, { backgroundColor: '#eb001b', marginRight: -6 }]} />
        <View style={[estilos.circulo, { backgroundColor: '#f79e1b', opacity: 0.92 }]} />
      </View>
    );
  }
  if (marca === 'amex') {
    return (
      <View style={[estilos.logo, { backgroundColor: '#2e77bc' }]}>
        <Texto variante="pequeno" style={estilos.textoAmex}>
          AMEX
        </Texto>
      </View>
    );
  }
  return (
    <View style={[estilos.logo, { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.borde }]}>
      <CreditCard size={14} color={color.textoTenue} />
    </View>
  );
}

// Vista previa de la tarjeta con los colores de la academia; gira al escribir el CVV
function TarjetaVisual({ datos, marca, reverso }: { datos: DatosTarjeta; marca: MarcaTarjeta; reverso: boolean }) {
  const { borrador } = useRegistro();
  const giro = useSharedValue(0);
  useEffect(() => {
    giro.value = withTiming(reverso ? 180 : 0, { duration: 520 });
  }, [reverso, giro]);

  const base = borrador.colorSecundario;
  const tinta = textoSobre(base, '#14161a');
  const suave = tinta === '#ffffff' ? 'rgba(255,255,255,0.68)' : 'rgba(20,22,26,0.6)';
  const fondo: [string, string, string] = [mezclar(base, borrador.colorPrimario, 0.45), mezclar(base, borrador.colorPrimario, 0.12), base];

  const frente = useAnimatedStyle(() => ({
    opacity: giro.value < 90 ? 1 : 0,
    transform: [{ perspective: 1000 }, { rotateY: `${giro.value}deg` }],
  }));
  const atras = useAnimatedStyle(() => ({
    opacity: giro.value >= 90 ? 1 : 0,
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(giro.value, [0, 180], [180, 360])}deg` }],
  }));

  const digitos = soloDigitos(datos.numero);
  const plantilla = marca === 'amex' ? '•••• •••••• •••••' : '•••• •••• •••• ••••';
  let k = 0;
  const numero = plantilla.replace(/•/g, () => digitos[k++] ?? '•');

  return (
    <View style={estilos.marcoTarjeta}>
      <Animated.View style={[StyleSheet.absoluteFill, frente]}>
        <LinearGradient colors={fondo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.tarjeta}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 0.6 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={estilos.filaTarjeta}>
            <Texto variante="cuerpoFuerte" numberOfLines={1} style={{ color: tinta, flexShrink: 1 }}>
              {borrador.nombreAcademia.trim() || 'GestAcademy'}
            </Texto>
            {marca !== 'desconocida' && <LogoMarca marca={marca} />}
          </View>
          <View style={estilos.chip} />
          <Texto variante="encabezado" cifras numberOfLines={1} adjustsFontSizeToFit style={{ color: tinta, letterSpacing: 2 }}>
            {numero}
          </Texto>
          <View style={estilos.filaTarjeta}>
            <View style={{ flex: 1, gap: 2 }}>
              <Texto variante="pequeno" style={{ color: suave, fontSize: 10, letterSpacing: 1 }}>
                TITULAR
              </Texto>
              <Texto variante="detalle" numberOfLines={1} style={{ color: tinta, fontFamily: 'Inter_600SemiBold' }}>
                {datos.titular.trim().toUpperCase() || 'NOMBRE APELLIDO'}
              </Texto>
            </View>
            <View style={{ gap: 2, alignItems: 'flex-end' }}>
              <Texto variante="pequeno" style={{ color: suave, fontSize: 10, letterSpacing: 1 }}>
                VENCE
              </Texto>
              <Texto variante="detalle" cifras style={{ color: tinta, fontFamily: 'Inter_600SemiBold' }}>
                {datos.vencimiento || 'MM/AA'}
              </Texto>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, atras]}>
        <LinearGradient colors={[...fondo].reverse() as [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[estilos.tarjeta, { paddingHorizontal: 0 }]}>
          <View style={estilos.banda} />
          <View style={estilos.firma}>
            <View style={estilos.rayas} />
            <View style={estilos.cvv}>
              <Texto variante="cuerpoFuerte" cifras style={{ color: '#14161a', letterSpacing: 2 }}>
                {datos.cvv.replace(/./g, '•') || '•••'}
              </Texto>
            </View>
          </View>
          <Texto variante="pequeno" style={{ color: suave, paddingHorizontal: 22 }}>
            Código de seguridad
          </Texto>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// Pago aprobado: confeti con los colores de la academia y un cristal con la confirmación
function Celebracion({ plan }: { plan: string }) {
  const { color, radio } = useTema();
  const { borrador } = useRegistro();
  const colores = [borrador.colorPrimario, mezclar(borrador.colorPrimario, '#ffffff', 0.5), '#ffd166', '#06d6a0', '#118ab2', '#ffffff'];
  return (
    <Animated.View entering={FadeIn.duration(250)} style={[StyleSheet.absoluteFill, estilos.celebracion, { backgroundColor: color.velo }]}>
      <Animated.View entering={ZoomIn.springify().damping(14)}>
        <Cristal grueso intensidad={80} style={[estilos.aviso, { borderRadius: radio.xl + 6, borderColor: color.contornoLuz }]}>
          <View style={[estilos.palomita, { backgroundColor: color.marca, boxShadow: `0 12px 30px -8px ${color.brillo}` }]}>
            <Check size={34} color={color.sobreMarca} strokeWidth={3} />
          </View>
          <Texto variante="encabezado" style={{ textAlign: 'center' }}>
            ¡Pago aprobado!
          </Texto>
          <Texto variante="detalle" tono="suave" style={{ textAlign: 'center' }}>
            Bienvenido a {plan}. Preparando tu academia…
          </Texto>
        </Cristal>
      </Animated.View>
      <Confeti activo colores={colores} />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  nota: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 },
  columnas: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' },
  columna: { gap: 20 },
  rotulo: { textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Inter_600SemiBold' },
  resumen: { gap: 14, padding: 20 },
  filaResumen: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filaTotal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  separador: { height: StyleSheet.hairlineWidth, marginHorizontal: -20 },
  prueba: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  grupo: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  campo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, minHeight: 64 },
  entrada: { paddingVertical: 0, minWidth: 0 },
  filaPartida: { flexDirection: 'row' },
  divisor: { width: StyleSheet.hairlineWidth },
  aceptadas: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  logo: { height: 22, minWidth: 34, paddingHorizontal: 6, borderRadius: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  textoVisa: { color: '#ffffff', fontFamily: 'Inter_700Bold', fontStyle: 'italic', fontSize: 11, letterSpacing: 0.5 },
  textoAmex: { color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.6 },
  circulo: { width: 13, height: 13, borderRadius: 7 },
  incluye: { gap: 12, padding: 20 },
  beneficio: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  palomitaBeneficio: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  // Proporción de una tarjeta bancaria real (85.6 × 54 mm)
  // En una columna no pasa de 460: en tableta no se ve desproporcionada
  marcoTarjeta: { width: '100%', maxWidth: 460, aspectRatio: 1.586, alignSelf: 'center' },
  tarjeta: { flex: 1, borderRadius: 20, padding: 22, justifyContent: 'space-between', overflow: 'hidden', boxShadow: '0 24px 50px -22px rgba(0,0,0,0.7)' },
  filaTarjeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  chip: { width: 44, height: 32, borderRadius: 7, backgroundColor: '#d9c27a', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)' },
  banda: { height: 44, backgroundColor: 'rgba(0,0,0,0.75)', marginTop: 4 },
  firma: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22 },
  rayas: { flex: 1, height: 38, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.85)' },
  cvv: { width: 64, height: 38, borderRadius: 4, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  celebracion: { alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50, overflow: 'hidden' },
  aviso: { width: 300, alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 28, borderWidth: StyleSheet.hairlineWidth },
  palomita: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
