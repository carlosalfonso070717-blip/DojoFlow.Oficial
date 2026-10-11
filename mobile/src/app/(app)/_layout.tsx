import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import { BarraLateral } from '@/components/BarraLateral';
import { useDiseno } from '@/hooks/useDiseno';
import { useTema } from '@/theme';
import { ProveedorTour } from '@/tour/Tour';

export default function AppLayout() {
  const { color, tipografia } = useTema();
  const { esEscritorio } = useDiseno();

  return (
    <ProveedorTour>
      {/* En la web de escritorio la barra lateral acompaña a todas las secciones, Ajustes incluido */}
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: color.fondo }}>
        {esEscritorio && <BarraLateral />}
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="registrar"
              options={{
                presentation: 'modal',
                // En web el encabezado nativo no trae cómo cerrar: la pantalla dibuja el suyo
                headerShown: Platform.OS !== 'web',
                title: 'Inscribir alumno',
                headerStyle: { backgroundColor: color.fondo },
                headerTintColor: color.texto,
                headerTitleStyle: { fontFamily: tipografia.subtitulo.fontFamily },
                headerShadowVisible: false,
              }}
            />
          </Stack>
        </View>
      </View>
    </ProveedorTour>
  );
}
