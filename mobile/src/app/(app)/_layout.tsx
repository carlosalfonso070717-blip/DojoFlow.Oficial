import { Stack } from 'expo-router';
import { useTema } from '@/theme';
import { ProveedorTour } from '@/tour/Tour';

export default function AppLayout() {
  const { color, tipografia } = useTema();

  return (
    <ProveedorTour>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="registrar"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Inscribir alumno',
            headerStyle: { backgroundColor: color.fondo },
            headerTintColor: color.texto,
            headerTitleStyle: { fontFamily: tipografia.subtitulo.fontFamily },
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </ProveedorTour>
  );
}
