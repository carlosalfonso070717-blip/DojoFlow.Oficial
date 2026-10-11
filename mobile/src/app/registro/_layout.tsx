import { Stack } from 'expo-router';
import { ProveedorRegistro } from '@/onboarding/RegistroContexto';
import { ProveedorTema, useTema } from '@/theme';

function Pasos() {
  const { color } = useTema();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: color.fondo },
      }}
    >
      {/* En la pantalla final ya no se puede volver: la cuenta existe */}
      <Stack.Screen name="listo" options={{ gestureEnabled: false, animation: 'fade' }} />
    </Stack>
  );
}

// El registro es neutro: aún no hay academia. Su color solo aparece en la vista previa de la credencial.
export default function RegistroLayout() {
  return (
    <ProveedorRegistro>
      <ProveedorTema neutro>
        <Pasos />
      </ProveedorTema>
    </ProveedorRegistro>
  );
}
