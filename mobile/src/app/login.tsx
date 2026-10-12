import { router } from 'expo-router';
import { ClipboardCheck, Mail, Package, Tablet, UsersRound, Wallet, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';
import { useSesion } from '@/auth/session';
import { BotonGoogle, googleDisponible } from '@/components/BotonGoogle';
import { CreditoSolullan } from '@/components/CreditoSolullan';
import { IconoCandado, IconoCandadoAbierto, IconoIniciarSesion } from '@/components/iconos/Iconly';
import { Marca, Monograma } from '@/components/Logo';
import { Separador } from '@/components/Separador';
import { Boton, Campo, Texto } from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { dejarCuentaGoogle } from '@/onboarding/googlePendiente';
import { useTema } from '@/theme';
import { conAlfa } from '@/theme/color';
import { alerta } from '@/utils/alerta';

// Entrada escalonada: una sola secuencia al abrir la pantalla
const entrada = (orden: number) => FadeInDown.delay(80 + orden * 70).duration(520).easing(Easing.out(Easing.cubic));

const FUNCIONES: { icono: LucideIcon; titulo: string; detalle: string }[] = [
  { icono: UsersRound, titulo: 'Alumnos', detalle: 'Inscripciones, clases y expedientes' },
  { icono: Wallet, titulo: 'Cobros', detalle: 'Mensualidades, recibos y adeudos' },
  { icono: ClipboardCheck, titulo: 'Asistencias', detalle: 'Registro con PIN desde la recepción' },
  { icono: Package, titulo: 'Inventario y finanzas', detalle: 'Ventas, existencias y reportes' },
];

export default function LoginScreen() {
  const { color } = useTema();
  const { esTableta, margen } = useDiseno();
  const { iniciarSesion, entrarConGoogle, tokenKiosco } = useSesion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const refPassword = useRef<TextInput>(null);

  async function entrar() {
    if (!email.trim() || !password) {
      alerta('Faltan datos', 'Escribe tu correo y tu contraseña.');
      return;
    }
    setCargando(true);
    try {
      // Al guardar el token, Stack.Protected lleva solo al panel
      await iniciarSesion(email.trim(), password);
    } catch (e) {
      alerta('No se pudo iniciar sesión', (e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  // Con cuenta: entra directo. Sin cuenta: el registro sigue con su Google, sin pedir correo ni contraseña
  async function conGoogle(idToken: string) {
    const r = await entrarConGoogle(idToken);
    if (r.registrado) return;
    dejarCuentaGoogle({ idToken, email: r.email, nombre: r.nombre });
    router.push('/registro');
  }

  function crearCuenta() {
    dejarCuentaGoogle(null);
    router.push('/registro');
  }

  const formulario = (
    <View style={estilos.formulario}>
      {!esTableta && (
        <Animated.View entering={entrada(0)}>
          <Marca />
        </Animated.View>
      )}

      <Animated.View entering={entrada(1)} style={{ gap: 10 }}>
        <Texto variante="gigante" accessibilityRole="header">
          Bienvenido de vuelta
        </Texto>
        <Texto variante="cuerpo" tono="suave">
          Entra al panel de tu academia.
        </Texto>
      </Animated.View>

      {googleDisponible && (
        <Animated.View entering={entrada(2)} style={{ gap: 24 }}>
          <BotonGoogle onToken={conGoogle} />
          <Separador texto="o con tu correo" />
        </Animated.View>
      )}

      <Animated.View entering={entrada(3)} style={{ gap: 16 }}>
        <Campo
          etiqueta="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@academia.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          icono={Mail}
          returnKeyType="next"
          onSubmitEditing={() => refPassword.current?.focus()}
        />
        <View style={{ gap: 10 }}>
          <Campo
            ref={refPassword}
            etiqueta="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            icono={IconoCandado}
            iconoVisible={IconoCandadoAbierto}
            returnKeyType="go"
            onSubmitEditing={entrar}
          />
          <Pressable onPress={() => router.push('/recuperar')} hitSlop={8} style={{ alignSelf: 'flex-end' }} accessibilityRole="link">
            <Texto variante="detalle" tono="suave">
              ¿Olvidaste tu contraseña?
            </Texto>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View entering={entrada(4)} style={{ gap: 20 }}>
        <Boton titulo="Iniciar sesión" icono={IconoIniciarSesion} onPress={entrar} cargando={cargando} />
        <View style={estilos.alternativa}>
          <Texto variante="detalle" tono="suave">
            ¿Aún no tienes cuenta?
          </Texto>
          <Pressable onPress={crearCuenta} hitSlop={10} accessibilityRole="link">
            <Texto variante="detalle" style={{ fontFamily: 'Figtree_700Bold', color: color.texto, textDecorationLine: 'underline' }}>
              Crear cuenta
            </Texto>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );

  const credito = (
    <Animated.View entering={FadeIn.delay(700).duration(600)} style={estilos.credito}>
      <CreditoSolullan />
    </Animated.View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['top', 'bottom']}>
      {/* El kiosco solo aparece en tablets que un coach ya vinculó a su academia */}
      {tokenKiosco && (
        <Pressable
          onPress={() => router.push('/kiosco')}
          style={[estilos.kiosco, { borderColor: color.borde, backgroundColor: color.superficie }]}
          accessibilityRole="button"
          accessibilityLabel="Abrir registrador de asistencias"
        >
          <Tablet size={16} color={color.texto} />
          <Texto variante="pequeno" style={{ fontFamily: 'Figtree_600SemiBold' }}>
            Asistencias
          </Texto>
        </Pressable>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {esTableta ? (
          // En tableta y escritorio: presentación a la izquierda, formulario a la derecha
          <View style={estilos.dividido}>
            <Presentacion />
            <ScrollView contentContainerStyle={[estilos.ladoFormulario, { paddingHorizontal: margen }]} keyboardShouldPersistTaps="handled">
              <View style={estilos.centro}>{formulario}</View>
              {credito}
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[estilos.movil, { paddingHorizontal: margen }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={estilos.centro}>{formulario}</View>
            {credito}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Panel de marca neutro: tinta profunda con un resplandor suave, sin colores de academia
function Presentacion() {
  const { color, oscuro } = useTema();
  const fondo = oscuro ? color.superficie : color.marca;
  const tinta = oscuro ? color.texto : color.sobreMarca;
  const suave = conAlfa(tinta, 0.62);
  const linea = conAlfa(tinta, 0.1);

  return (
    <Animated.View entering={FadeIn.duration(600)} style={[estilos.panel, { backgroundColor: fondo, borderColor: linea }]}>
      {/* Resplandor y retícula decorativos */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="resplandor" cx="85%" cy="0%" r="75%">
            <Stop offset="0" stopColor={tinta} stopOpacity={oscuro ? 0.1 : 0.14} />
            <Stop offset="1" stopColor={tinta} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="base" cx="0%" cy="100%" r="60%">
            <Stop offset="0" stopColor={tinta} stopOpacity={0.06} />
            <Stop offset="1" stopColor={tinta} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#resplandor)" />
        <Rect width="100%" height="100%" fill="url(#base)" />
      </Svg>
      <View style={estilos.reticula} pointerEvents="none">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[estilos.anillo, { borderColor: linea, width: 200 + i * 140, height: 200 + i * 140, borderRadius: 60 + i * 36 }]}
          />
        ))}
      </View>

      <View style={estilos.encabezadoPanel}>
        <Monograma size={40} tinta={tinta} papel={fondo} />
        <Texto variante="encabezado" style={{ color: tinta, letterSpacing: -0.4 }}>
          GestAcademy
        </Texto>
      </View>

      <View style={{ gap: 36, maxWidth: 460 }}>
        <View style={{ gap: 16 }}>
          <Texto variante="pequeno" style={{ color: suave, letterSpacing: 1.6, textTransform: 'uppercase', fontFamily: 'Figtree_600SemiBold' }}>
            Gestión para academias
          </Texto>
          <Texto variante="gigante" style={{ color: tinta, fontSize: 56, lineHeight: 58, letterSpacing: -2 }}>
            Tu academia,{'\n'}en orden.
          </Texto>
          <Texto variante="cuerpo" style={{ color: suave, fontSize: 17, lineHeight: 26 }}>
            Artes marciales, danza, música y más. Todo lo de tu academia en un solo lugar, desde cualquier dispositivo.
          </Texto>
        </View>

        <View style={[estilos.funciones, { borderColor: linea }]}>
          {FUNCIONES.map(({ icono: Icono, titulo, detalle }, i) => (
            <Animated.View
              key={titulo}
              entering={FadeInDown.delay(250 + i * 80).duration(500).easing(Easing.out(Easing.cubic))}
              style={[estilos.funcion, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth * 2, borderColor: linea }]}
            >
              <View style={[estilos.iconoFuncion, { backgroundColor: conAlfa(tinta, 0.08) }]}>
                <Icono size={18} color={tinta} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Texto variante="cuerpoFuerte" style={{ color: tinta }}>
                  {titulo}
                </Texto>
                <Texto variante="detalle" style={{ color: suave }}>
                  {detalle}
                </Texto>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  movil: { flexGrow: 1, paddingTop: 32, paddingBottom: 16, gap: 40 },
  centro: { flexGrow: 1, justifyContent: 'center' },
  formulario: { gap: 32, width: '100%', maxWidth: 420, alignSelf: 'center' },
  alternativa: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  credito: { alignItems: 'center', paddingTop: 8 },
  dividido: { flex: 1, flexDirection: 'row' },
  panel: {
    flex: 1,
    maxWidth: 720,
    margin: 16,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: 48,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  reticula: { position: 'absolute', top: -330, right: -330, width: 660, height: 660, alignItems: 'center', justifyContent: 'center' },
  anillo: { position: 'absolute', borderWidth: StyleSheet.hairlineWidth * 2 },
  encabezadoPanel: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  funciones: { borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 22, paddingHorizontal: 18 },
  funcion: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  iconoFuncion: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ladoFormulario: { flexGrow: 1, paddingTop: 48, paddingBottom: 24, gap: 40 },
  kiosco: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
