import { router } from 'expo-router';
import { KeyRound, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { olvidePassword, resetearPassword } from '@/api/endpoints';
import { Boton, Campo, Texto } from '@/components/ui';
import { useTema } from '@/theme';

export default function RecuperarScreen() {
  const { espacio } = useTema();
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
      Alert.alert('Revisa los datos', (e as Error).message);
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
      Alert.alert('Contraseña actualizada', r.mensaje, [{ text: 'Iniciar sesión', onPress: () => router.back() }]);
    });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[estilos.contenedor, { padding: espacio.xl }]} keyboardShouldPersistTaps="handled">
        <Texto variante="cuerpo" tono="suave">
          {pinEnviado
            ? `Si ${email.trim()} tiene una cuenta, te llegó un código de 6 dígitos. Escríbelo junto con tu nueva contraseña.`
            : 'Te enviaremos un código a tu correo para que elijas una contraseña nueva.'}
        </Texto>

        <Campo
          etiqueta="Correo"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          icono={Mail}
          editable={!pinEnviado}
        />

        {pinEnviado ? (
          <View style={{ gap: 14 }}>
            <Campo etiqueta="Código" value={pin} onChangeText={setPin} keyboardType="number-pad" maxLength={6} icono={KeyRound} autoFocus />
            <Campo etiqueta="Nueva contraseña" value={nueva} onChangeText={setNueva} secureTextEntry icono={Lock} ayuda="Mínimo 6 caracteres." />
            <Boton titulo="Cambiar contraseña" onPress={restablecer} cargando={cargando} />
            <Boton titulo="Usar otro correo" variante="fantasma" tamano="compacto" onPress={() => setPinEnviado(false)} />
          </View>
        ) : (
          <Boton titulo="Enviar código" onPress={pedirPin} cargando={cargando} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
});
