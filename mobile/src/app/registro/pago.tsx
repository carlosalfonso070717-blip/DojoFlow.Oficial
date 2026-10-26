import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { CalendarDays, Check, CreditCard, FlaskConical, Lock, UserRound } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';
import Animated, { FadeIn, interpolate, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { Confeti } from '@/components/Confeti';
import { Cristal } from '@/components/Cristal';
import { Boton, Campo, formatoMoneda, Grupo, ParDato, Superficie, Texto } from '@/components/ui';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro } from '@/onboarding/RegistroContexto';
import { fechaRenovacion, formatoFecha, precioDe } from '@/suscripciones/catalogo';
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

  return (
    <View style={{ flex: 1 }}>
      <PantallaPaso
        paso="pago"
        titulo="Datos de pago"
        descripcion={`Activa ${plan.nombre} para ${borrador.nombreAcademia.trim() || 'tu academia'}.`}
        continuar={{ titulo: procesando ? 'Procesando pago' : `Pagar ${formatoMoneda(monto)}`, onPress: pagar, cargando: procesando, deshabilitado: aprobado }}
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
        <TarjetaVisual datos={tarjeta} marca={marca} reverso={reverso} />

        {pasarela.modoPrueba && (
          <Superficie style={[estilos.prueba, { backgroundColor: color.avisoSuave, borderColor: 'transparent' }]}>
            <FlaskConical size={18} color={color.aviso} />
            <View style={{ flex: 1, gap: 2 }}>
              <Texto variante="cuerpoFuerte" style={{ fontSize: 14, lineHeight: 19 }}>
                Modo de prueba
              </Texto>
              <Texto variante="pequeno" tono="suave">
                No se hace ningún cargo. Usa {TARJETAS_PRUEBA.aprobada}; la terminada en 0002 se rechaza.
              </Texto>
            </View>
            <Boton
              titulo="Llenar"
              variante="tonal"
              tamano="compacto"
              onPress={() => {
                setRechazo(null);
                setTarjeta((t) => ({ titular: t.titular || 'Titular de prueba', numero: TARJETAS_PRUEBA.aprobada, vencimiento: '12/30', cvv: '123' }));
              }}
            />
          </Superficie>
        )}

        <Campo
          etiqueta="Nombre en la tarjeta"
          icono={UserRound}
          value={tarjeta.titular}
          onChangeText={(v) => cambiar('titular', v)}
          autoCapitalize="characters"
          autoComplete="cc-name"
          returnKeyType="next"
          onSubmitEditing={() => refNumero.current?.focus()}
          error={errores.titular}
        />
        <Campo
          ref={refNumero}
          etiqueta="Número de tarjeta"
          icono={CreditCard}
          value={tarjeta.numero}
          onChangeText={(v) => {
            const formateado = formatearNumero(v);
            cambiar('numero', formateado);
            if (soloDigitos(formateado).length === (marcaDe(formateado) === 'amex' ? 15 : 16)) refVence.current?.focus();
          }}
          placeholder="1234 5678 9012 3456"
          keyboardType="number-pad"
          autoComplete="cc-number"
          error={errores.numero}
        />
        <View style={estilos.fila}>
          <View style={{ flex: 1 }}>
            <Campo
              ref={refVence}
              etiqueta="Vencimiento"
              icono={CalendarDays}
              value={tarjeta.vencimiento}
              onChangeText={(v) => {
                const formateado = formatearVencimiento(v);
                cambiar('vencimiento', formateado);
                if (formateado.length === 5) refCvv.current?.focus();
              }}
              placeholder="MM/AA"
              keyboardType="number-pad"
              autoComplete="cc-exp"
              error={errores.vencimiento}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Campo
              ref={refCvv}
              etiqueta="CVV"
              icono={Lock}
              value={tarjeta.cvv}
              onChangeText={(v) => cambiar('cvv', soloDigitos(v).slice(0, largoCvv(marca)))}
              onFocus={() => setReverso(true)}
              onBlur={() => setReverso(false)}
              placeholder={marca === 'amex' ? '1234' : '123'}
              keyboardType="number-pad"
              autoComplete="cc-csc"
              error={errores.cvv}
            />
          </View>
        </View>

        <Grupo titulo="Resumen">
          <ParDato etiqueta="Plan" valor={plan.nombre} />
          <ParDato etiqueta="Periodo" valor={periodo === 'anual' ? 'Anual' : 'Mensual'} />
          <ParDato etiqueta="Siguiente cobro" valor={formatoFecha(fechaRenovacion(periodo))} />
          <ParDato etiqueta="Total hoy" valor={`${formatoMoneda(monto)} ${plan.moneda}`} />
        </Grupo>
      </PantallaPaso>

      {aprobado && <Celebracion plan={plan.nombre} />}
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
            <Texto variante="subtitulo" style={{ color: tinta, fontStyle: 'italic', letterSpacing: 0.5 }}>
              {marca === 'visa' ? 'VISA' : marca === 'mastercard' ? 'mastercard' : marca === 'amex' ? 'AMEX' : ''}
            </Texto>
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
  prueba: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  fila: { flexDirection: 'row', gap: 12 },
  // Proporción de una tarjeta bancaria real (85.6 × 54 mm)
  marcoTarjeta: { width: '100%', maxWidth: 380, aspectRatio: 1.586, alignSelf: 'center', marginBottom: 8 },
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
