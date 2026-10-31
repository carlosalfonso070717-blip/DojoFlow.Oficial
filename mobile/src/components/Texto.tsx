import { Children, type ReactNode } from 'react';
import { Text, type TextProps } from 'react-native';
import { useCifraAnimada } from '@/hooks/useCifraAnimada';
import { useTema, type Tema } from '@/theme';

export type Variante = keyof Tema['tipografia'];
export type Tono = 'normal' | 'suave' | 'tenue' | 'marca' | 'exito' | 'aviso' | 'peligro' | 'sobreMarca';

type Props = TextProps & {
  variante?: Variante;
  tono?: Tono;
  // Cifras con ancho fijo para que las cantidades se alineen en columnas
  cifras?: boolean;
  // Al cambiar la cifra, cuenta del valor anterior al nuevo en vez de saltar.
  // 'desde-cero' además cuenta desde 0 al aparecer (cifras protagonistas de cada pantalla)
  animada?: boolean | 'desde-cero';
};

// Une los hijos en un solo texto si todos son texto o números ("+", 12, "% vs sep")
function textoPlano(hijos: ReactNode): string | null {
  const partes = Children.toArray(hijos);
  return partes.every((p) => typeof p === 'string' || typeof p === 'number') ? partes.join('') : null;
}

export function Texto({ variante = 'cuerpo', tono = 'normal', cifras, animada, style, children, ...props }: Props) {
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

  const plano = animada ? textoPlano(children) : null;
  const animado = useCifraAnimada(plano ?? '', plano !== null, animada === 'desde-cero');

  return (
    <Text
      {...props}
      // Las cifras animadas siempre van con ancho fijo: así el texto no "tiembla" mientras cuenta
      style={[tipografia[variante], { color: colores[tono] }, (cifras || animada) && { fontVariant: ['tabular-nums'] }, style]}
    >
      {plano !== null ? animado : children}
    </Text>
  );
}
