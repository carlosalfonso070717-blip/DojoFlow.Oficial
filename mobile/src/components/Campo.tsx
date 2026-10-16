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
  // En contraseñas: ícono mientras el texto está visible (p. ej. candado abierto)
  iconoVisible?: ComponentType<PropsIcono>;
  // Sin etiqueta visible y un poco más bajo (pantallas que deben caber sin scroll); la etiqueta sigue para accesibilidad
  compacto?: boolean;
};

export const Campo = forwardRef<TextInput, Props>(function Campo(
  { etiqueta, ayuda, error, icono, iconoVisible, compacto, secureTextEntry, style, onFocus, onBlur, ...props },
  ref,
) {
  const { color, radio, tipografia, oscuro } = useTema();
  const [enfocado, setEnfocado] = useState(false);
  const [oculto, setOculto] = useState(true);
  const esPassword = !!secureTextEntry;
  const Icono = esPassword && !oculto && iconoVisible ? iconoVisible : icono;

  // En reposo el campo casi no tiene borde; al enfocarlo aparece un halo suave del color de la marca
  const colorBorde = error ? color.peligro : enfocado ? color.marcaTexto : oscuro ? color.borde : color.contorno;
  const halo = error ? color.peligroSuave : enfocado ? color.marcaSuave : null;

  return (
    <View style={{ gap: 8 }}>
      {!compacto && (
        <Texto variante="detalle" tono="suave">
          {etiqueta}
        </Texto>
      )}
      <View
        style={[
          estilos.caja,
          compacto && { minHeight: 50 },
          {
            backgroundColor: color.superficie,
            borderColor: colorBorde,
            borderRadius: radio.m + 2,
            borderWidth: 1,
            boxShadow: halo ? `0 0 0 4px ${halo}` : oscuro ? undefined : '0 0.5px 1.5px rgba(16,18,24,0.06)',
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
          style={[tipografia.cuerpo, estilos.input, compacto && { paddingVertical: 11 }, { color: color.texto }, sinContornoWeb, style]}
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
  caja: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 56 },
  input: { flex: 1, paddingVertical: 14 },
});
