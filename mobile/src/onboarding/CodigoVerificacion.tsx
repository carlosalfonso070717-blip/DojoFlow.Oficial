import { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Texto } from '@/components/ui';
import { useTema } from '@/theme';

const LARGO = 6;

// Seis casillas para el código del correo; un solo TextInput invisible recibe lo que se escribe
// (así funciona pegar el código y el autocompletado de SMS/correo del sistema)
export function CodigoVerificacion({ valor, onCambio, error }: { valor: string; onCambio: (v: string) => void; error?: boolean }) {
  const { color, radio } = useTema();
  const input = useRef<TextInput>(null);

  // Se enfoca después de la transición de entrada; autoFocus solo no basta en todas las plataformas
  useEffect(() => {
    const t = setTimeout(() => input.current?.focus(), 450);
    return () => clearTimeout(t);
  }, []);

  return (
    <Pressable onPress={() => input.current?.focus()} accessibilityLabel="Código de verificación">
      <View style={estilos.fila}>
        {Array.from({ length: LARGO }).map((_, i) => {
          const actual = i === valor.length;
          const lleno = i < valor.length;
          return (
            <View
              key={i}
              style={[
                estilos.casilla,
                {
                  borderRadius: radio.m,
                  backgroundColor: color.superficie,
                  borderColor: error ? color.peligro : actual ? color.marcaTexto : lleno ? color.bordeFuerte : color.borde,
                  borderWidth: actual || error ? 2 : 1,
                },
              ]}
            >
              <Texto variante="cifra" style={{ fontSize: 28 }}>
                {valor[i] ?? ''}
              </Texto>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={input}
        value={valor}
        onChangeText={(t) => onCambio(t.replace(/\D/g, '').slice(0, LARGO))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={LARGO}
        caretHidden
        style={estilos.oculto}
      />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  casilla: { flex: 1, aspectRatio: 0.82, maxWidth: 58, alignItems: 'center', justifyContent: 'center' },
  oculto: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
