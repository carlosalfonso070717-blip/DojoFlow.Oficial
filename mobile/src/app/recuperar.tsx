import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { olvidePassword, resetearPassword } from '@/api/endpoints';
import { Boton, Campo, Tarjeta } from '@/components/ui';
import { useTema } from '@/theme';

export default function RecuperarScreen() {
  const tema = useTema();
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
      Alert.alert('Atención', (e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  const pedirPin = () =>
    ejecutar(async () => {
      const r = await olvidePassword(email.trim());
      setPinEnviado(true);
      Alert.alert('Revisa tu correo', r.mensaje);
    });

  const restablecer = () =>
    ejecutar(async () => {
      const r = await resetearPassword(email.trim(), pin.trim(), nueva);
      Alert.alert('¡Listo!', r.mensaje, [{ text: 'Iniciar sesión', onPress: () => router.back() }]);
    });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        <Tarjeta style={{ gap: 16 }}>
          <Text style={{ color: tema.textMuted }}>
            {pinEnviado
              ? 'Escribe el PIN que te llegó por correo y tu nueva contraseña.'
              : 'Te enviaremos un PIN a tu correo para restablecer tu contraseña.'}
          </Text>

          <Campo
            etiqueta="Correo"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!pinEnviado}
          />

          {pinEnviado ? (
            <>
              <Campo etiqueta="PIN" value={pin} onChangeText={setPin} keyboardType="number-pad" maxLength={6} />
              <Campo
                etiqueta="Nueva contraseña"
                value={nueva}
                onChangeText={setNueva}
                secureTextEntry
                placeholder="Mínimo 6 caracteres"
              />
              <Boton titulo="Restablecer contraseña" onPress={restablecer} cargando={cargando} />
              <Text
                onPress={() => setPinEnviado(false)}
                style={{ color: tema.primary, fontWeight: '600', textAlign: 'center' }}
              >
                Usar otro correo / reenviar PIN
              </Text>
            </>
          ) : (
            <Boton titulo="Enviar PIN" onPress={pedirPin} cargando={cargando} />
          )}
        </Tarjeta>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
});
