import { router } from 'expo-router';
import { Lock, Mail, Tablet } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSesion } from '@/auth/session';
import { Boton, Campo, Texto } from '@/components/ui';
import { useTema } from '@/theme';

export default function LoginScreen() {
  const { color, espacio } = useTema();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[estilos.contenedor, { padding: espacio.xl }]} keyboardShouldPersistTaps="handled">
          <View style={estilos.marca}>
            <View style={[estilos.sello, { backgroundColor: color.marca }]}>
              <Texto variante="encabezado" style={{ color: color.sobreMarca, fontSize: 26 }}>
                D
              </Texto>
            </View>
            <Texto variante="titulo" style={{ fontSize: 40, lineHeight: 44 }}>
              DojoFlow
            </Texto>
            <Texto variante="cuerpo" tono="suave">
              Alumnos, cobros e inventario de tu academia en un solo lugar.
            </Texto>
          </View>

          <View style={{ gap: 14 }}>
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
            <Campo
              ref={refPassword}
              etiqueta="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              icono={Lock}
              returnKeyType="go"
              onSubmitEditing={entrar}
            />
            <Texto
              variante="detalle"
              tono="marca"
              onPress={() => router.push('/recuperar')}
              style={{ alignSelf: 'flex-end', paddingVertical: 4 }}
              accessibilityRole="link"
            >
              Olvidé mi contraseña
            </Texto>
          </View>

          <View style={{ gap: 10 }}>
            <Boton titulo="Iniciar sesión" onPress={entrar} cargando={cargando} />
            <Boton titulo="Crear mi academia" variante="contorno" onPress={() => router.push('/registro')} />
          </View>

          {/* Solo en tablets que un coach ya vinculó a su academia */}
          {tokenKiosco && <Boton titulo="Abrir kiosco" icono={Tablet} variante="fantasma" onPress={() => router.push('/kiosco')} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexGrow: 1, justifyContent: 'center', gap: 32, maxWidth: 480, width: '100%', alignSelf: 'center' },
  marca: { gap: 8 },
  sello: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
