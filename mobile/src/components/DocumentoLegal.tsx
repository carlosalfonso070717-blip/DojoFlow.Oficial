import { router, Stack } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDiseno } from '@/hooks/useDiseno';
import { useTema } from '@/theme';
import { CreditoSolullan } from './CreditoSolullan';
import { Marca } from './Logo';
import { Texto } from './Texto';

// `nota` va después de la lista (los párrafos, antes)
export type Seccion = { titulo: string; parrafos?: string[]; lista?: string[]; nota?: string };

type Props = { titulo: string; actualizado: string; intro: string; secciones: Seccion[] };

// Página pública de lectura (aviso de privacidad, términos): se abre con o sin sesión
export function DocumentoLegal({ titulo, actualizado, intro, secciones }: Props) {
  const { color, radio } = useTema();
  const { margen } = useDiseno();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: `${titulo} · GestAcademy` }} />
      <ScrollView contentContainerStyle={[estilos.contenido, { paddingHorizontal: margen }]}>
        <View style={estilos.columna}>
          <View style={estilos.barra}>
            <Marca />
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={8}
              accessibilityRole="button"
              style={[estilos.volver, { borderColor: color.borde, backgroundColor: color.superficie, borderRadius: radio.total }]}
            >
              <ChevronLeft size={16} color={color.texto} />
              <Texto variante="detalle">Volver</Texto>
            </Pressable>
          </View>

          <View style={{ gap: 12 }}>
            <Texto variante="titulo" accessibilityRole="header">
              {titulo}
            </Texto>
            <Texto variante="detalle" tono="tenue">
              Última actualización: {actualizado}
            </Texto>
            <Texto variante="cuerpo" tono="suave">
              {intro}
            </Texto>
          </View>

          {secciones.map((s, i) => (
            <View key={s.titulo} style={{ gap: 10 }}>
              <Texto variante="encabezado" style={{ fontSize: 19, lineHeight: 24 }}>
                {i + 1}. {s.titulo}
              </Texto>
              {s.parrafos?.map((p) => (
                <Texto key={p} variante="cuerpo" tono="suave">
                  {p}
                </Texto>
              ))}
              {s.lista?.map((item) => (
                <View key={item} style={estilos.item}>
                  <Texto variante="cuerpo" tono="tenue">
                    •
                  </Texto>
                  <Texto variante="cuerpo" tono="suave" style={{ flex: 1 }}>
                    {item}
                  </Texto>
                </View>
              ))}
              {s.nota && (
                <Texto variante="cuerpo" tono="suave">
                  {s.nota}
                </Texto>
              )}
            </View>
          ))}

          <View style={[estilos.pie, { borderColor: color.borde }]}>
            <CreditoSolullan />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingVertical: 32 },
  columna: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 32 },
  barra: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 10, paddingRight: 14, paddingVertical: 8, borderWidth: StyleSheet.hairlineWidth * 2 },
  item: { flexDirection: 'row', gap: 10, paddingLeft: 4 },
  pie: { borderTopWidth: StyleSheet.hairlineWidth * 2, paddingTop: 24, alignItems: 'center' },
});
