import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTema } from '@/theme';
import { Presionable } from './Presionable';
import { Texto } from './Texto';

type Variante = 'primario' | 'tonal' | 'contorno' | 'fantasma' | 'peligro';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  tamano?: 'normal' | 'compacto';
  icono?: LucideIcon;
  cargando?: boolean;
  deshabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Boton({ titulo, onPress, variante = 'primario', tamano = 'normal', icono: Icono, cargando, deshabilitado, style }: Props) {
  const { color, radio } = useTema();
  const inactivo = cargando || deshabilitado;

  const estilosPorVariante: Record<Variante, { fondo: string; texto: string; borde?: string }> = {
    primario: { fondo: color.marca, texto: color.sobreMarca },
    tonal: { fondo: color.marcaSuave, texto: color.marcaTexto },
    contorno: { fondo: 'transparent', texto: color.texto, borde: color.bordeFuerte },
    fantasma: { fondo: 'transparent', texto: color.marcaTexto },
    peligro: { fondo: color.peligroSuave, texto: color.peligro },
  };
  const v = estilosPorVariante[variante];
  const compacto = tamano === 'compacto';

  return (
    <Presionable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      vibracion={variante === 'primario' ? 'media' : 'ligera'}
      style={[
        estilos.base,
        {
          backgroundColor: v.fondo,
          borderRadius: radio.m,
          minHeight: compacto ? 40 : 52,
          paddingHorizontal: compacto ? 14 : 20,
        },
        v.borde && { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: v.borde },
        inactivo && { opacity: 0.5 },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={v.texto} />
      ) : (
        <View style={estilos.contenido}>
          {Icono && <Icono size={compacto ? 17 : 19} color={v.texto} strokeWidth={2.2} />}
          <Texto variante={compacto ? 'detalle' : 'cuerpoFuerte'} style={{ color: v.texto }} numberOfLines={1}>
            {titulo}
          </Texto>
        </View>
      )}
    </Presionable>
  );
}

const estilos = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
