import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SessionProvider, useSesion } from '@/auth/session';
import { useTema } from '@/theme';

function RootNavigator() {
  const { token, cargando } = useSesion();
  const tema = useTema();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: tema.background }}>
        <ActivityIndicator color={tema.primary} size="large" />
      </View>
    );
  }

  const conEncabezado = {
    headerShown: true,
    headerStyle: { backgroundColor: tema.card },
    headerTintColor: tema.text,
    headerBackTitle: 'Atrás',
  };

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tema.background } }}>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!token}>
        <Stack.Screen name="login" />
        <Stack.Screen name="registro" options={{ ...conEncabezado, title: 'Registro de coach' }} />
        <Stack.Screen name="recuperar" options={{ ...conEncabezado, title: 'Recuperar contraseña' }} />
      </Stack.Protected>

      {/* El kiosco es público: lo usan los alumnos en la tablet de recepción */}
      <Stack.Screen name="kiosco" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </SessionProvider>
  );
}
