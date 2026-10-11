import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDiseno } from '@/hooks/useDiseno';
import { useTema } from '@/theme';
import { BotonAtras } from './BotonAtras';
import { Texto } from './Texto';

type Props = {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  // Acción fija al pie (p. ej. "Guardar cambios")
  pie?: ReactNode;
  acciones?: ReactNode;
  // Pantallas a las que también se llega desde la barra lateral (escritorio): sin botón de regresar
  principal?: boolean;
};

// Plantilla de pantallas dentro de Ajustes: regresar, título grande y contenido con ancho de lectura
export function PantallaSecundaria({ titulo, descripcion, children, pie, acciones, principal }: Props) {
  const { color } = useTema();
  const { margen, maximo, arriba, esEscritorio } = useDiseno();
  const ancho = { maxWidth: maximo, width: '100%' as const, alignSelf: 'center' as const };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['top', 'bottom']}>
      <View style={[estilos.barra, { paddingHorizontal: margen, paddingTop: 8 + arriba }, ancho]}>
        {principal && esEscritorio ? <View /> : <BotonAtras alterno="/" />}
        {acciones}
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[estilos.contenido, { paddingHorizontal: margen }, ancho]} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 8 }}>
            <Texto variante="titulo" accessibilityRole="header">
              {titulo}
            </Texto>
            {descripcion && (
              <Texto variante="cuerpo" tono="suave">
                {descripcion}
              </Texto>
            )}
          </View>
          {children}
        </ScrollView>
        {pie && (
          <View style={[estilos.pie, { paddingHorizontal: margen, borderTopColor: color.borde }]}>
            <View style={ancho}>{pie}</View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  barra: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  contenido: { gap: 28, paddingTop: 16, paddingBottom: 40 },
  pie: { paddingTop: 12, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
});
