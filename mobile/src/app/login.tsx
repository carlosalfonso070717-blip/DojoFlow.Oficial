import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSesion } from '@/auth/session';
import { Boton, Campo, Tarjeta } from '@/components/ui';
import { useTema } from '@/theme';

export default function LoginScreen() {
  const tema = useTema();
  const { iniciarSesion, tokenKiosco } = useSesion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    if (!email.trim() || !password) {
      Alert.alert('Atención', 'Ingresa tu correo y contraseña.');
      return;
    }
    setCargando(true);
    try {
      // Al guardar el token, Stack.Protected manda solo al panel
      await iniciarSesion(email.trim(), password);
    } catch (e) {
      Alert.alert('Atención', (e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tema.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
          <View style={estilos.encabezado}>
            <Text style={[estilos.logo, { color: tema.primary }]}>🥋 DojoFlow</Text>
            <Text style={{ color: tema.textMuted, fontSize: 15 }}>Gestión para academias</Text>
          </View>

          <Tarjeta style={{ gap: 16 }}>
            <Campo
              etiqueta="Correo"
              value={email}
              onChangeText={setEmail}
              placeholder="coach@dojoflow.club"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Campo
              etiqueta="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!verPassword}
              autoComplete="password"
              onSubmitEditing={entrar}
            />
            <Text
              onPress={() => setVerPassword((v) => !v)}
              style={{ color: tema.primary, fontWeight: '600', alignSelf: 'flex-end' }}
            >
              {verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            </Text>
            <Boton titulo="Iniciar sesión" onPress={entrar} cargando={cargando} />
            <View style={estilos.enlaces}>
              <Text onPress={() => router.push('/recuperar')} style={{ color: tema.textMuted, fontWeight: '600' }}>
                ¿Olvidaste tu contraseña?
              </Text>
              <Text onPress={() => router.push('/registro')} style={{ color: tema.primary, fontWeight: '700' }}>
                Crear mi academia
              </Text>
            </View>
          </Tarjeta>

          {/* Solo en tablets que un coach ya vinculó a su academia */}
          {tokenKiosco && (
            <Boton titulo="Abrir modo Kiosco" variante="secundario" onPress={() => router.push('/kiosco')} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
  encabezado: { alignItems: 'center', gap: 6, marginBottom: 8 },
  logo: { fontSize: 36, fontWeight: '800' },
  enlaces: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
});
