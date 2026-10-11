import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { olvidePassword, resetearPassword } from '@/api/endpoints';
import { BotonAtras } from '@/components/BotonAtras';
import { IconoCandado, IconoCandadoAbierto } from '@/components/iconos/Iconly';
import { Boton, Campo, Texto } from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { CodigoVerificacion } from '@/onboarding/CodigoVerificacion';
import { useTema } from '@/theme';
import { alerta } from '@/utils/alerta';

const entrada = FadeInDown.duration(420).easing(Easing.out(Easing.cubic));

export default function RecuperarScreen() {
  const { color } = useTema();
  const { margen } = useDiseno();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [nueva, setNueva] = useState('');
  const [pinEnviado, setPinEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function ejecutar(fn: () => Promise<void>) {
    setCargando(true);
    try {
      await fn();
    } catch (e) {
      alerta('Revisa los datos', (e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  const pedirPin = () =>
    ejecutar(async () => {
      await olvidePassword(email.trim());
      setPinEnviado(true);
    });

  const restablecer = () =>
    ejecutar(async () => {
      const r = await resetearPassword(email.trim(), pin.trim(), nueva);
      alerta('Contraseña actualizada', r.mensaje, [{ text: 'Iniciar sesión', onPress: () => router.back() }]);
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: margen, paddingTop: 8 }}>
        <BotonAtras />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[estilos.contenido, { paddingHorizontal: margen }]} keyboardShouldPersistTaps="handled">
          {/* Cada etapa entra con su propia animación al cambiar `key` */}
          <Animated.View key={pinEnviado ? 'codigo' : 'correo'} entering={entrada} style={{ gap: 32 }}>
            <View style={{ gap: 10 }}>
              <Texto variante="gigante" accessibilityRole="header">
                {pinEnviado ? 'Revisa tu correo' : 'Recupera tu acceso'}
              </Texto>
              <Texto variante="cuerpo" tono="suave">
                {pinEnviado
                  ? `Si ${email.trim()} tiene una cuenta, te llegó un código de 6 dígitos.`
                  : 'Te enviaremos un código para que elijas una contraseña nueva.'}
              </Texto>
            </View>

            {pinEnviado ? (
              <View style={{ gap: 18 }}>
                <CodigoVerificacion valor={pin} onCambio={setPin} />
                <Campo
                  etiqueta="Nueva contraseña"
                  value={nueva}
                  onChangeText={setNueva}
                  secureTextEntry
                  icono={IconoCandado}
                  iconoVisible={IconoCandadoAbierto}
                  ayuda="Mínimo 6 caracteres."
                  autoComplete="new-password"
                />
                <Boton titulo="Cambiar contraseña" onPress={restablecer} cargando={cargando} deshabilitado={pin.length !== 6 || nueva.length < 6} />
                <Boton titulo="Usar otro correo" variante="fantasma" tamano="compacto" onPress={() => setPinEnviado(false)} />
              </View>
            ) : (
              <View style={{ gap: 18 }}>
                <Campo
                  etiqueta="Correo"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  icono={Mail}
                  placeholder="tu@academia.com"
                  autoFocus
                />
                <Boton titulo="Enviar código" onPress={pedirPin} cargando={cargando} deshabilitado={!email.includes('@')} />
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingTop: 28, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
});
