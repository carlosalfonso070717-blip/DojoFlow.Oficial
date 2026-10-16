import { Search, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTema } from '@/theme';
import { Texto } from './Texto';

// Título grande de cada sección, con acciones a la derecha
export function Encabezado({ titulo, detalle, acciones }: { titulo: string; detalle?: string; acciones?: ReactNode }) {
  return (
    <View style={estilos.encabezado}>
      <View style={{ flex: 1, gap: 2 }}>
        <Texto variante="titulo" accessibilityRole="header">
          {titulo}
        </Texto>
        {detalle ? (
          <Texto variante="detalle" tono="suave">
            {detalle}
          </Texto>
        ) : null}
      </View>
      {acciones && <View style={estilos.acciones}>{acciones}</View>}
    </View>
  );
}

export function Buscador({ value, onChangeText, ...props }: TextInputProps & { value: string; onChangeText: (t: string) => void }) {
  const { color, radio, tipografia, oscuro } = useTema();
  return (
    <View style={[estilos.buscador, { backgroundColor: oscuro ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)', borderRadius: radio.m }]}>
      <Search size={18} color={color.textoTenue} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={color.textoTenue}
        selectionColor={color.marcaTexto}
        autoCorrect={false}
        returnKeyType="search"
        {...props}
        style={[tipografia.cuerpo, { flex: 1, color: color.texto, paddingVertical: 10 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Borrar búsqueda">
          <X size={18} color={color.textoTenue} />
        </Pressable>
      )}
    </View>
  );
}

// Botón redondo de ícono para encabezados
export function BotonIcono({ icono, onPress, etiqueta, destacado }: { icono: ReactNode; onPress: () => void; etiqueta: string; destacado?: boolean }) {
  const { color } = useTema();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={({ pressed }) => [
        estilos.botonIcono,
        { backgroundColor: destacado ? color.marca : color.superficie, borderColor: color.contorno, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {icono}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingTop: 8, paddingBottom: 4 },
  acciones: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  buscador: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, minHeight: 42 },
  botonIcono: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
