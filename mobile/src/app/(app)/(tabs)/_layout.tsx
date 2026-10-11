import { Tabs } from 'expo-router';
import { Package, Users } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { useSesion } from '@/auth/session';
import { BarraLiquida, type PestanaLiquida } from '@/components/BarraLiquida';
import { IconoFinanzas, IconoInicio, IconoPagos } from '@/components/iconos/Iconly';
import { plural } from '@/utils/texto';

// Props de la barra tal como las entrega expo-router (sin depender de @react-navigation directamente)
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONOS: Record<string, PestanaLiquida['icono']> = {
  index: IconoInicio,
  alumnos: Users,
  mensualidades: IconoPagos,
  inventario: Package,
  finanzas: IconoFinanzas,
};

function Barra({ state, descriptors, navigation }: BottomTabBarProps) {
  const pestanas: PestanaLiquida[] = state.routes.map((ruta) => {
    const { options } = descriptors[ruta.key];
    return { clave: ruta.key, etiqueta: options.title ?? ruta.name, icono: ICONOS[ruta.name] ?? IconoInicio };
  });

  return (
    <BarraLiquida
      pestanas={pestanas}
      activa={state.index}
      onCambiar={(i) => {
        const ruta = state.routes[i];
        const evento = navigation.emit({ type: 'tabPress', target: ruta.key, canPreventDefault: true });
        if (state.index !== i && !evento.defaultPrevented) navigation.navigate(ruta.name, ruta.params);
      }}
    />
  );
}

export default function TabsLayout() {
  const { perfil } = useSesion();
  const termino = perfil?.academia.terminoAlumno || 'Alumno';
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <Barra {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="alumnos" options={{ title: plural(termino) }} />
      <Tabs.Screen name="mensualidades" options={{ title: 'Cobros' }} />
      <Tabs.Screen name="inventario" options={{ title: 'Inventario' }} />
      <Tabs.Screen name="finanzas" options={{ title: 'Finanzas' }} />
    </Tabs>
  );
}
