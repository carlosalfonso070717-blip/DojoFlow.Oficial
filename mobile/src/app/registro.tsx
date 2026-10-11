import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { confirmarVerificacion, enviarVerificacion, registrarCoach } from '@/api/endpoints';
import { Boton, Campo, Tarjeta } from '@/components/ui';
import { useTema } from '@/theme';

// Mismo flujo que login.html: verificar correo con PIN → registrar con código de invitación
export default function RegistroScreen() {
  const tema = useTema();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [pinEnviado, setPinEnviado] = useState(false);
  const [correoVerificado, setCorreoVerificado] = useState('');
  const [ocupado, setOcupado] = useState<'enviar' | 'confirmar' | 'registrar' | null>(null);

  const verificado = correoVerificado !== '' && correoVerificado === email.trim().toLowerCase();

  async function ejecutar(accion: typeof ocupado, fn: () => Promise<void>) {
    setOcupado(accion);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Atención', (e as Error).message);
    } finally {
      setOcupado(null);
    }
  }

  const enviar = () =>
    ejecutar('enviar', async () => {
      if (!email.trim()) throw new Error('Escribe tu correo antes de verificarlo.');
      const r = await enviarVerificacion(email.trim());
      setPinEnviado(true);
      Alert.alert('Revisa tu correo', r.mensaje);
    });

  const confirmar = () =>
    ejecutar('confirmar', async () => {
      if (!pin.trim()) throw new Error('Escribe el código que te llegó por correo.');
      await confirmarVerificacion(email.trim(), pin.trim());
      setCorreoVerificado(email.trim().toLowerCase());
      setPinEnviado(false);
    });

  const registrar = () =>
    ejecutar('registrar', async () => {
      if (!verificado) throw new Error('Primero debes verificar tu correo.');
      const r = await registrarCoach({ nombre, email: email.trim(), password, codigoInvitacion: codigo });
      Alert.alert('Registro exitoso', r.mensaje, [{ text: 'Iniciar sesión', onPress: () => router.back() }]);
    });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        <Tarjeta style={{ gap: 16 }}>
          <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} autoCapitalize="words" />

          <Campo
            etiqueta="Correo"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setPinEnviado(false);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          {verificado ? (
            <Text style={{ color: tema.success, fontWeight: '700' }}>✓ Correo verificado</Text>
          ) : pinEnviado ? (
            <View style={{ gap: 10 }}>
              <Campo
                etiqueta="Código de verificación"
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Boton titulo="Confirmar código" onPress={confirmar} cargando={ocupado === 'confirmar'} />
              <Text onPress={enviar} style={{ color: tema.primary, fontWeight: '600', textAlign: 'center' }}>
                Reenviar código
              </Text>
            </View>
          ) : (
            <Boton titulo="Verificar correo" variante="secundario" onPress={enviar} cargando={ocupado === 'enviar'} />
          )}

          <Campo etiqueta="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholder="Mínimo 6 caracteres" />
          <Campo etiqueta="Código de invitación" value={codigo} onChangeText={setCodigo} autoCapitalize="none" />

          <Boton
            titulo="Crear cuenta"
            onPress={registrar}
            cargando={ocupado === 'registrar'}
            deshabilitado={!verificado}
          />
        </Tarjeta>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
});
