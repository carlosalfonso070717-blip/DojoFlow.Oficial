import { Image } from 'expo-image';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTema } from '@/theme';

const SITIO = 'https://solullan.com';

// Colores del logotipo de Solullan (solullan.com): "Solu" en tinta y "llan" en cursiva teal
const SOLULLAN = {
  tinta: '#12100e',
  marfil: '#f4efe6',
  teal: '#0f766e',
  tealClaro: '#5eead4',
};

// En la web es un <a> de verdad (abre en otra pestaña); en el celular abre el navegador
const enlace =
  Platform.OS === 'web'
    ? ({ href: SITIO, hrefAttrs: { target: '_blank', rel: 'noopener' } } as object)
    : { onPress: () => Linking.openURL(SITIO) };

// `sobreOscuro` fuerza los colores invertidos (p. ej. encima de una foto)
export function CreditoSolullan({ sobreOscuro }: { sobreOscuro?: boolean }) {
  const { color, oscuro } = useTema();
  const invertido = sobreOscuro ?? oscuro;
  const textoSuave = sobreOscuro ? 'rgba(255,255,255,0.6)' : color.textoTenue;

  return (
    <View style={estilos.fila}>
      <Text style={[estilos.prefijo, { color: textoSuave }]}>Desarrollado por</Text>
      <Pressable
        {...enlace}
        accessibilityRole="link"
        accessibilityLabel="Solullan, abre solullan.com"
        hitSlop={8}
        style={({ pressed }) => [estilos.marca, pressed && { opacity: 0.6 }]}
      >
        <View style={estilos.isotipo}>
          <Image
            source={require('../../assets/solullan/isotipo-tinta.png')}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            tintColor={invertido ? SOLULLAN.marfil : undefined}
          />
          <Image source={require('../../assets/solullan/isotipo-teal.png')} style={StyleSheet.absoluteFill} contentFit="contain" />
        </View>
        <Text style={[estilos.palabra, { color: invertido ? SOLULLAN.marfil : SOLULLAN.tinta }]}>
          Solu
          <Text style={[estilos.cursiva, { color: invertido ? SOLULLAN.tealClaro : SOLULLAN.teal }]}>llan</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  prefijo: { fontFamily: 'Figtree_500Medium', fontSize: 12, letterSpacing: 0.2 },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  isotipo: { width: 17, height: 18 },
  palabra: { fontFamily: 'Inter_500Medium', fontSize: 14, letterSpacing: -0.42 },
  cursiva: { fontFamily: 'Inter_500Medium_Italic' },
});
