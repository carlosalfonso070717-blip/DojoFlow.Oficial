import { Text, type TextProps } from 'react-native';
import { useTema, type Tema } from '@/theme';

export type Variante = keyof Tema['tipografia'];
export type Tono = 'normal' | 'suave' | 'tenue' | 'marca' | 'exito' | 'aviso' | 'peligro' | 'sobreMarca';

type Props = TextProps & {
  variante?: Variante;
  tono?: Tono;
  // Cifras con ancho fijo para que las cantidades se alineen en columnas
  cifras?: boolean;
};

export function Texto({ variante = 'cuerpo', tono = 'normal', cifras, style, ...props }: Props) {
  const { tipografia, color } = useTema();
  const colores: Record<Tono, string> = {
    normal: color.texto,
    suave: color.textoSuave,
    tenue: color.textoTenue,
    marca: color.marcaTexto,
    exito: color.exito,
    aviso: color.aviso,
    peligro: color.peligro,
    sobreMarca: color.sobreMarca,
  };

  return (
    <Text
      {...props}
      style={[tipografia[variante], { color: colores[tono] }, cifras && { fontVariant: ['tabular-nums'] }, style]}
    />
  );
}
