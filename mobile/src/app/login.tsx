import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';
import type { CredencialGoogle } from '@/auth/google';
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

// Ancho máximo del formulario; con él se ubica el crédito en el hueco junto al panel
const ANCHO_FORMULARIO = 420;

export default function LoginScreen() {
  const { color } = useTema();
  const { esTableta, margen } = useDiseno();
  const { height: alto } = useWindowDimensions();
  // En el celular todo debe caber sin scroll: los espacios y el título se ajustan a la altura disponible
  const compacto = !esTableta;
  const bajo = compacto && alto < 640;
  const separacion = !compacto ? 32 : bajo ? 14 : alto < 760 ? 20 : 26;
  const { iniciarSesion, entrarConGoogle } = useSesion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const refPassword = useRef<TextInput>(null);
  const [anchoColumna, setAnchoColumna] = useState(0);
  const [anchoCredito, setAnchoCredito] = useState(0);
  // En tableta y escritorio el crédito va abajo, en una línea, centrado en el hueco junto al panel (o pegado a él si no cabe)
  const hueco = (anchoColumna - ANCHO_FORMULARIO) / 2;
  const izquierdaCredito = Math.max(24, (hueco - anchoCredito) / 2);

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
  async function conGoogle(credencial: CredencialGoogle) {
    const r = await entrarConGoogle(credencial);
    if (r.registrado) return;
    dejarCuentaGoogle({ credencial, email: r.email, nombre: r.nombre });
    router.push('/registro');
  }

  function crearCuenta() {
    dejarCuentaGoogle(null);
    router.push('/registro');
  }

  const formulario = (
    <View style={[estilos.formulario, { gap: separacion }]}>
      {!esTableta && (
        <Animated.View entering={entrada(0)}>
          <Marca />
        </Animated.View>
      )}

      <Animated.View entering={entrada(1)} style={{ gap: compacto ? 6 : 10 }}>
        <Texto
          variante="gigante"
          accessibilityRole="header"
          style={compacto && { fontSize: bajo ? 28 : 32, lineHeight: bajo ? 32 : 36, letterSpacing: -0.9 }}
        >
          Bienvenido de vuelta
        </Texto>
        {!bajo && (
          <Texto variante="cuerpo" tono="suave">
            Entra al panel de tu academia.
          </Texto>
        )}
      </Animated.View>


      <Animated.View entering={entrada(3)} style={{ gap: compacto ? 12 : 16 }}>
        <Campo
          etiqueta="Correo"
          compacto={compacto}
          value={email}
          onChangeText={setEmail}
          placeholder={compacto ? 'Correo' : 'tu@academia.com'}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          icono={Mail}
          returnKeyType="next"
          onSubmitEditing={() => refPassword.current?.focus()}
        />
        <View style={{ gap: compacto ? 8 : 10 }}>
          <Campo
            ref={refPassword}
            etiqueta="Contraseña"
            compacto={compacto}
            placeholder={compacto ? 'Contraseña' : undefined}
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

      <Animated.View entering={entrada(4)} style={{ gap: compacto ? 14 : 20 }}>
        <Boton
          titulo="Iniciar sesión"
          icono={IconoIniciarSesion}
          onPress={entrar}
          cargando={cargando}
          style={compacto && { minHeight: 50 }}
        />
        {googleDisponible && (
          <View style={{ gap: compacto ? 12 : 16 }}>
            <Separador texto="o inicia con" />
            <BotonGoogle onToken={conGoogle} style={compacto && { minHeight: 50 }} />
          </View>
        )}
        <View style={estilos.alternativa}>
          <Texto variante="detalle" tono="suave">
            ¿Aún no tienes cuenta?
          </Texto>
          <Pressable onPress={crearCuenta} hitSlop={10} accessibilityRole="link">
            <Texto variante="detalle" style={{ fontFamily: 'Inter_700Bold', color: color.texto, textDecorationLine: 'underline' }}>
              Crear cuenta
            </Texto>
          </Pressable>
        </View>
        <Texto variante="pequeno" tono="tenue" style={{ textAlign: 'center' }}>
          Al continuar aceptas los{' '}
          <Texto variante="pequeno" tono="suave" onPress={() => router.push('/terminos')} accessibilityRole="link" style={estilos.enlaceLegal}>
            Términos
          </Texto>{' '}
          y el{' '}
          <Texto variante="pequeno" tono="suave" onPress={() => router.push('/privacidad')} accessibilityRole="link" style={estilos.enlaceLegal}>
            Aviso de privacidad
          </Texto>
          .
        </Texto>
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {esTableta ? (
          // En tableta y escritorio: presentación a la izquierda, formulario a la derecha
          <View style={estilos.dividido}>
            <Presentacion />
            <View style={{ flex: 1 }} onLayout={(e) => setAnchoColumna(e.nativeEvent.layout.width)}>
              <ScrollView contentContainerStyle={[estilos.ladoFormulario, { paddingHorizontal: margen }]} keyboardShouldPersistTaps="handled">
                <View style={estilos.centro}>{formulario}</View>
              </ScrollView>
              <View
                style={[estilos.creditoAlLado, { left: izquierdaCredito, opacity: anchoCredito ? 1 : 0 }]}
                onLayout={(e) => setAnchoCredito(e.nativeEvent.layout.width)}
              >
                {credito}
              </View>
            </View>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[estilos.movil, { paddingHorizontal: margen, paddingTop: bajo ? 12 : 24 }]}
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

      <View style={{ gap: 16, maxWidth: 460 }}>
        <Texto variante="pequeno" style={{ color: suave, letterSpacing: 1.6, textTransform: 'uppercase', fontFamily: 'Inter_600SemiBold' }}>
          Gestión para academias
        </Texto>
        <Texto variante="gigante" style={{ color: tinta, fontSize: 56, lineHeight: 58, letterSpacing: -2 }}>
          Tu academia,{'\n'}en orden.
        </Texto>
        <Texto variante="cuerpo" style={{ color: suave, fontSize: 17, lineHeight: 26 }}>
          Artes marciales, danza, música y más. Todo lo de tu academia en un solo lugar, desde cualquier dispositivo.
        </Texto>
      </View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  movil: { flexGrow: 1, paddingBottom: 12, gap: 16 },
  centro: { flexGrow: 1, justifyContent: 'center' },
  formulario: { width: '100%', maxWidth: ANCHO_FORMULARIO, alignSelf: 'center' },
  enlaceLegal: { textDecorationLine: 'underline' },
  alternativa: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  credito: { alignItems: 'center', paddingTop: 8 },
  creditoAlLado: { position: 'absolute', bottom: 28 },
  dividido: { flex: 1, flexDirection: 'row' },
  panel: {
    flex: 1,
    maxWidth: 620,
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
  ladoFormulario: { flexGrow: 1, paddingTop: 48, paddingBottom: 72, gap: 40 },
});
