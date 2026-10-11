import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { ChartColumn, House, Package, Users, Wallet, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSesion } from '@/auth/session';
import { Presionable, Texto } from '@/components/ui';
import { useTema } from '@/theme';
import { plural } from '@/utils/texto';

// Props de la barra tal como las entrega expo-router (sin depender de @react-navigation directamente)
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONOS: Record<string, LucideIcon> = {
  index: House,
  alumnos: Users,
  mensualidades: Wallet,
  inventario: Package,
  finanzas: ChartColumn,
};

// Barra inferior propia: la pestaña activa se marca con una cápsula del color de la academia
function BarraPestanas({ state, descriptors, navigation }: BottomTabBarProps) {
  const { color } = useTema();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        estilos.barra,
        { backgroundColor: color.superficie, borderTopColor: color.borde, paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      {state.routes.map((ruta, i) => {
        const activa = state.index === i;
        const { options } = descriptors[ruta.key];
        const etiqueta = (options.tabBarLabel as string) ?? options.title ?? ruta.name;
        const Icono = ICONOS[ruta.name] ?? House;

        return (
          <Presionable
            key={ruta.key}
            escala={0.92}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={etiqueta}
            onPress={() => {
              const evento = navigation.emit({ type: 'tabPress', target: ruta.key, canPreventDefault: true });
              if (!activa && !evento.defaultPrevented) navigation.navigate(ruta.name, ruta.params);
            }}
            style={estilos.pestana}
          >
            <View style={[estilos.capsula, activa && { backgroundColor: color.marcaSuave }]}>
              <Icono size={22} color={activa ? color.marcaTexto : color.textoTenue} strokeWidth={activa ? 2.4 : 2} />
            </View>
            <Texto
              variante="pequeno"
              style={{ color: activa ? color.marcaTexto : color.textoTenue, fontFamily: activa ? 'Figtree_700Bold' : 'Figtree_500Medium' }}
            >
              {etiqueta}
            </Texto>
          </Presionable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { perfil } = useSesion();
  const termino = perfil?.academia.terminoAlumno || 'Alumno';
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BarraPestanas {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="alumnos" options={{ title: plural(termino) }} />
      <Tabs.Screen name="mensualidades" options={{ title: 'Cobros' }} />
      <Tabs.Screen name="inventario" options={{ title: 'Inventario' }} />
      <Tabs.Screen name="finanzas" options={{ title: 'Finanzas' }} />
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  barra: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 6 },
  pestana: { flex: 1, alignItems: 'center', gap: 3 },
  capsula: { width: 56, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
