import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_500Medium_Italic } from '@expo-google-fonts/inter/500Medium_Italic';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SessionProvider, useSesion } from '@/auth/session';
import { ProveedorTema, useTema } from '@/theme';

// La splash se queda hasta tener fuentes y sesión: así la app abre ya con los colores de la academia
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { token, cargando } = useSesion();
  const { color, oscuro } = useTema();
  const [fuentesListas, errorFuentes] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    // Solo para el logotipo de Solullan en el crédito
    Inter_500Medium,
    Inter_500Medium_Italic,
  });
  const listo = !cargando && (fuentesListas || !!errorFuentes);

  useEffect(() => {
    if (listo) SplashScreen.hideAsync().catch(() => {});
  }, [listo]);

  if (!listo) return null;


  return (
    <>
      <StatusBar style={oscuro ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo } }}>
        <Stack.Protected guard={!!token}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>

        <Stack.Protected guard={!token}>
          {/* Entre login, registro y recuperar: fundido corto, sin desplazamientos bruscos */}
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="registro" options={{ animation: 'fade', animationDuration: 260 }} />
          <Stack.Screen name="recuperar" options={{ animation: 'fade', animationDuration: 260 }} />
        </Stack.Protected>

        {/* El kiosco usa su propio token: funciona con o sin sesión de coach */}
        <Stack.Screen name="kiosco" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <ProveedorTema>
          <RootNavigator />
        </ProveedorTema>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
