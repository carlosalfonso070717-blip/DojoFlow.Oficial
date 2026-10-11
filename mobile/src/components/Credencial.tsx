import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { MarcaAcademia } from '@/api/endpoints';
import { mezclar, textoSobre } from '@/theme/color';
import { useTema } from '@/theme';
import { Avatar } from './Elementos';
import { Texto } from './Texto';

// La identidad de la academia como credencial de membresía: es la pieza protagonista
// de la app y la única que usa los dos colores de marca a pleno
export function Credencial({ academia, children }: { academia: MarcaAcademia; children?: ReactNode }) {
  const { radio, fuentes } = useTema();
  const base = academia.colorSecundario;
  const tinta = textoSobre(base, '#14161a');
  const tintaSuave = tinta === '#ffffff' ? 'rgba(255,255,255,0.7)' : 'rgba(20,22,26,0.65)';

  return (
    <Animated.View entering={FadeInDown.duration(420).springify().damping(18)}>
      <LinearGradient
        colors={[mezclar(base, academia.colorPrimario, 0.18), base]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[estilos.tarjeta, { borderRadius: radio.xl }]}
      >
        {/* Franja con el color principal, como el cinto o el listón de la academia */}
        <View style={[estilos.franja, { backgroundColor: academia.colorPrimario }]} />

        <View style={estilos.cabecera}>
          <View style={[estilos.marcoLogo, { borderColor: academia.colorPrimario }]}>
            <Avatar nombre={academia.nombre} logoUrl={academia.logoUrl} tamano={52} />
          </View>
          <View style={{ flex: 1 }}>
            <Texto
              variante="encabezado"
              numberOfLines={2}
              style={{ color: tinta, fontFamily: fuentes.display, fontSize: 24, lineHeight: 28 }}
            >
              {academia.nombre}
            </Texto>
            <Texto variante="detalle" style={{ color: tintaSuave }}>
              {academia.tipoNegocio}
            </Texto>
          </View>
        </View>

        {children && <View style={estilos.cuerpo}>{children}</View>}
      </LinearGradient>
    </Animated.View>
  );
}

// Cifra dentro de la credencial
export function DatoCredencial({ valor, etiqueta, fondo }: { valor: string; etiqueta: string; fondo: string }) {
  const tinta = textoSobre(fondo, '#14161a');
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Texto variante="cifra" cifras style={{ color: tinta, fontSize: 28, lineHeight: 32 }} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Texto>
      <Texto variante="pequeno" style={{ color: tinta === '#ffffff' ? 'rgba(255,255,255,0.72)' : 'rgba(20,22,26,0.65)' }}>
        {etiqueta}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { padding: 20, paddingLeft: 26, overflow: 'hidden', gap: 20 },
  franja: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  marcoLogo: { borderWidth: 2, borderRadius: 30, padding: 2 },
  cuerpo: { flexDirection: 'row', gap: 12 },
});
