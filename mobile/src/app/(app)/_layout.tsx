import { Stack } from 'expo-router';
import { useTema } from '@/theme';

export default function AppLayout() {
  const { color, tipografia } = useTema();

  return (
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
  );
}
