import { router } from 'expo-router';
import { Mail, Tablet } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSesion } from '@/auth/session';
import { IconoCandado, IconoCandadoAbierto, IconoIniciarSesion } from '@/components/iconos/Iconly';
import { Marca, Monograma } from '@/components/Logo';
import { Boton, Campo, Texto } from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { useTema } from '@/theme';

// Entrada escalonada: una sola secuencia al abrir la pantalla
const entrada = (orden: number) => FadeInDown.delay(80 + orden * 70).duration(520).easing(Easing.out(Easing.cubic));

export default function LoginScreen() {
  const { color, oscuro } = useTema();
  const { esTableta, margen } = useDiseno();
  const { iniciarSesion, tokenKiosco } = useSesion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const refPassword = useRef<TextInput>(null);

  async function entrar() {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Escribe tu correo y tu contraseña.');
      return;
    }
    setCargando(true);
    try {
      // Al guardar el token, Stack.Protected lleva solo al panel
      await iniciarSesion(email.trim(), password);
    } catch (e) {
      Alert.alert('No se pudo iniciar sesión', (e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  const formulario = (
    <View style={[estilos.formulario, { paddingHorizontal: margen }]}>
      {!esTableta && (
        <Animated.View entering={entrada(0)}>
          <Marca />
        </Animated.View>
      )}

      <Animated.View entering={entrada(1)} style={{ gap: 10 }}>
        <Texto variante="gigante" accessibilityRole="header">
          Hola de nuevo
        </Texto>
        <Texto variante="cuerpo" tono="suave">
          Entra para ver tus alumnos, cobros e inventario.
        </Texto>
      </Animated.View>

      <Animated.View entering={entrada(2)} style={{ gap: 16 }}>
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

      <Animated.View entering={entrada(3)} style={{ gap: 20 }}>
        <Boton titulo="Iniciar sesión" icono={IconoIniciarSesion} onPress={entrar} cargando={cargando} />
        <View style={estilos.alternativa}>
          <Texto variante="detalle" tono="suave">
            ¿Aún no tienes cuenta?
          </Texto>
          <Pressable onPress={() => router.push('/registro')} hitSlop={10} accessibilityRole="link">
            <Texto variante="detalle" style={{ fontFamily: 'Figtree_700Bold', color: color.texto, textDecorationLine: 'underline' }}>
              Crear cuenta
            </Texto>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['top', 'bottom']}>
      {/* El kiosco solo aparece en tablets que un coach ya vinculó a su academia */}
      {tokenKiosco && (
        <Pressable
          onPress={() => router.push('/kiosco')}
          style={[estilos.kiosco, { borderColor: color.borde, backgroundColor: color.superficie }]}
          accessibilityRole="button"
          accessibilityLabel="Abrir kiosco"
        >
          <Tablet size={16} color={color.texto} />
          <Texto variante="pequeno" style={{ fontFamily: 'Figtree_600SemiBold' }}>
            Kiosco
          </Texto>
        </Pressable>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {esTableta ? (
          // En tableta: panel de marca a la izquierda, formulario a la derecha
          <View style={estilos.dividido}>
            <View style={[estilos.panel, { backgroundColor: oscuro ? color.superficie : color.marca }]}>
              <Monograma size={56} tinta={oscuro ? color.marca : color.sobreMarca} papel={oscuro ? color.sobreMarca : color.marca} />
              <View style={{ gap: 14, maxWidth: 380 }}>
                <Texto variante="gigante" style={{ color: oscuro ? color.texto : color.sobreMarca, fontSize: 52, lineHeight: 54 }}>
                  DojoFlow
                </Texto>
                <Texto variante="cuerpo" style={{ color: oscuro ? color.textoSuave : 'rgba(255,255,255,0.72)', fontSize: 18, lineHeight: 26 }}>
                  Alumnos, cobros e inventario de tu academia, en orden y desde cualquier dispositivo.
                </Texto>
              </View>
            </View>
            <ScrollView contentContainerStyle={estilos.ladoFormulario} keyboardShouldPersistTaps="handled">
              {formulario}
            </ScrollView>
          </View>
        ) : (
          <ScrollView contentContainerStyle={estilos.movil} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {formulario}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  movil: { flexGrow: 1, justifyContent: 'center', paddingVertical: 32 },
  formulario: { gap: 36, width: '100%', maxWidth: 440, alignSelf: 'center' },
  alternativa: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dividido: { flex: 1, flexDirection: 'row' },
  panel: { flex: 1, margin: 16, borderRadius: 32, padding: 48, justifyContent: 'space-between' },
  ladoFormulario: { flexGrow: 1, justifyContent: 'center', paddingVertical: 48 },
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
