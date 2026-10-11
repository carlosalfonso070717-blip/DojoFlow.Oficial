import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { mezclar, textoSobre } from '@/theme/color';
import { Campo } from './Campo';
import { Presionable } from './Presionable';
import { Texto } from './Texto';

// Paleta curada: colores con suficiente cuerpo para botones y marcas
export const PRINCIPALES = [
  '#d90429', '#e85d04', '#f4a100', '#2e7d32', '#00897b', '#0288d1',
  '#1565c0', '#3949ab', '#8e44ad', '#c2185b', '#6d4c41', '#37474f',
];

const esHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

// Fondos sugeridos para la credencial a partir del color principal
export function fondosPara(primario: string, extra?: string) {
  return [
    ...new Set([
      extra ?? '#14161a',
      '#14161a',
      mezclar(primario, '#000000', 0.72),
      mezclar(primario, '#ffffff', 0.88),
      '#f7f7f5',
    ]),
  ];
}

export function Muestras({ colores, elegido, onElegir }: { colores: string[]; elegido: string; onElegir: (c: string) => void }) {
  return (
    <View style={estilos.muestras} accessibilityRole="radiogroup">
      {colores.map((c) => {
        const activo = c.toLowerCase() === elegido.toLowerCase();
        return (
          <Presionable
            key={c}
            onPress={() => onElegir(c)}
            escala={0.9}
            accessibilityRole="radio"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={`Color ${c}`}
            style={[estilos.muestra, { backgroundColor: c, borderColor: activo ? mezclar(c, '#000000', 0.35) : 'rgba(0,0,0,0.08)' }]}
          >
            {activo && <Check size={20} color={textoSobre(c)} strokeWidth={3} />}
          </Presionable>
        );
      })}
    </View>
  );
}

type Props = {
  primario: string;
  secundario: string;
  onPrimario: (c: string) => void;
  onSecundario: (c: string) => void;
  sugerido?: { primario: string; secundario: string };
};

// Elección de color principal (paleta o hexadecimal) y fondo de la credencial
export function SelectorColores({ primario, secundario, onPrimario, onSecundario, sugerido }: Props) {
  const [hex, setHex] = useState('');
  const principales = sugerido && !PRINCIPALES.includes(sugerido.primario) ? [sugerido.primario, ...PRINCIPALES] : PRINCIPALES;

  return (
    <View style={{ gap: 28 }}>
      <View style={{ gap: 12 }}>
        <Texto variante="subtitulo">Color principal</Texto>
        <Muestras colores={principales} elegido={primario} onElegir={onPrimario} />
        <Campo
          etiqueta="O escribe un color"
          placeholder="#d90429"
          value={hex}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={7}
          error={hex.length === 7 && !esHex(hex) ? 'Usa el formato #RRGGBB' : null}
          onChangeText={(v) => {
            const limpio = v.startsWith('#') ? v : `#${v}`;
            setHex(limpio === '#' ? '' : limpio);
            if (esHex(limpio)) onPrimario(limpio.toLowerCase());
          }}
        />
      </View>

      <View style={{ gap: 12 }}>
        <Texto variante="subtitulo">Fondo de la credencial</Texto>
        <Muestras colores={fondosPara(primario, sugerido?.secundario)} elegido={secundario} onElegir={onSecundario} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  muestras: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  muestra: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
