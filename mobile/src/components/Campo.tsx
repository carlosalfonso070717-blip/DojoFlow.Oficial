import { forwardRef, useState, type ComponentType } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTema } from '@/theme';
import type { PropsIcono } from './iconos/Iconly';
import { OjoAnimado } from './iconos/OjoAnimado';
import { Texto } from './Texto';

type Props = TextInputProps & {
  etiqueta: string;
  ayuda?: string;
  error?: string | null;
  icono?: ComponentType<PropsIcono>;
};

export const Campo = forwardRef<TextInput, Props>(function Campo(
  { etiqueta, ayuda, error, icono: Icono, secureTextEntry, style, onFocus, onBlur, ...props },
  ref,
) {
  const { color, radio, tipografia } = useTema();
  const [enfocado, setEnfocado] = useState(false);
  const [oculto, setOculto] = useState(true);
  const esPassword = !!secureTextEntry;

  const colorBorde = error ? color.peligro : enfocado ? color.marcaTexto : color.borde;

  return (
    <View style={{ gap: 6 }}>
      <Texto variante="detalle" tono="suave">
        {etiqueta}
      </Texto>
      <View
        style={[
          estilos.caja,
          {
            backgroundColor: color.superficie,
            borderColor: colorBorde,
            borderRadius: radio.m,
            borderWidth: enfocado || error ? 1.5 : StyleSheet.hairlineWidth * 2,
          },
        ]}
      >
        {Icono && <Icono size={18} color={enfocado ? color.marcaTexto : color.textoTenue} />}
        <TextInput
          ref={ref}
          placeholderTextColor={color.textoTenue}
          selectionColor={color.marcaTexto}
          secureTextEntry={esPassword && oculto}
          accessibilityLabel={etiqueta}
          onFocus={(e) => {
            setEnfocado(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            onBlur?.(e);
          }}
          {...props}
          style={[tipografia.cuerpo, estilos.input, { color: color.texto }, sinContornoWeb, style]}
        />
        {esPassword && (
          <Pressable
            onPress={() => setOculto((o) => !o)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={oculto ? 'Mostrar contraseña' : 'Ocultar contraseña'}
          >
            <OjoAnimado abierto={!oculto} size={22} color={oculto ? color.textoSuave : color.marcaTexto} />
          </Pressable>
        )}
      </View>
      {(error || ayuda) && (
        <Texto variante="pequeno" tono={error ? 'peligro' : 'tenue'}>
          {error ?? ayuda}
        </Texto>
      )}
    </View>
  );
});

// El borde de enfoque ya lo dibuja la caja; en web el navegador añadiría otro
const sinContornoWeb = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

const estilos = StyleSheet.create({
  caja: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 52 },
  input: { flex: 1, paddingVertical: 12 },
});
