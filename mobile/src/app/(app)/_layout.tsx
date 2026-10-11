import { router, Tabs } from 'expo-router';
import { Alert, Pressable, Text, type ColorValue } from 'react-native';
import { useSesion } from '@/auth/session';
import { useTema } from '@/theme';

function IconoTab({ simbolo, color }: { simbolo: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{simbolo}</Text>;
}

export default function AppLayout() {
  const tema = useTema();
  const { cerrarSesion } = useSesion();

  function confirmarSalida() {
    Alert.alert('¿Cerrar sesión?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, salir', style: 'destructive', onPress: () => void cerrarSesion() },
    ]);
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: tema.card },
        headerTintColor: tema.text,
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: { backgroundColor: tema.card, borderTopColor: tema.border },
        tabBarActiveTintColor: tema.primary,
        tabBarInactiveTintColor: tema.textMuted,
        sceneStyle: { backgroundColor: tema.background },
        headerRight: () => (
          <Pressable onPress={confirmarSalida} hitSlop={12} style={{ marginRight: 16 }}>
            <Text style={{ color: tema.primary, fontWeight: '700' }}>Salir</Text>
          </Pressable>
        ),
        headerLeft: () => (
          <Pressable onPress={() => router.push('/kiosco')} hitSlop={12} style={{ marginLeft: 16 }}>
            <Text style={{ color: tema.textMuted, fontWeight: '700' }}>Kiosco</Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Alumnos',
          tabBarIcon: ({ color }) => <IconoTab simbolo="👥" color={color} />,
        }}
      />
      <Tabs.Screen
        name="registrar"
        options={{
          title: 'Nuevo registro',
          tabBarLabel: 'Registrar',
          tabBarIcon: ({ color }) => <IconoTab simbolo="＋" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mensualidades"
        options={{
          title: 'Mensualidades',
          tabBarLabel: 'Cobros',
          tabBarIcon: ({ color }) => <IconoTab simbolo="💳" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventario"
        options={{
          title: 'Inventario',
          tabBarIcon: ({ color }) => <IconoTab simbolo="📦" color={color} />,
        }}
      />
      <Tabs.Screen
        name="finanzas"
        options={{
          title: 'Finanzas',
          tabBarIcon: ({ color }) => <IconoTab simbolo="📊" color={color} />,
        }}
      />
    </Tabs>
  );
}
