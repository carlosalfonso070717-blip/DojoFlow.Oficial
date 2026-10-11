import { Stack } from 'expo-router';
import { ProveedorRegistro, useRegistro } from '@/onboarding/RegistroContexto';
import { ProveedorTema, useTema } from '@/theme';

// El asistente se pinta con los colores que la persona va eligiendo
function PasosConMarca() {
  const { borrador } = useRegistro();
  return (
    <ProveedorTema marca={{ primario: borrador.colorPrimario, secundario: borrador.colorSecundario }}>
      <Pasos />
    </ProveedorTema>
  );
}

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

export default function RegistroLayout() {
  return (
    <ProveedorRegistro>
      <PasosConMarca />
    </ProveedorRegistro>
  );
}
