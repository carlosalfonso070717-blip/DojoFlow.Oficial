import { router } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Campo, Grupo, Texto } from '@/components/ui';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro } from '@/onboarding/RegistroContexto';
import { useTema } from '@/theme';

export default function PasoClases() {
  const { color, tipografia } = useTema();
  const { borrador, actualizar } = useRegistro();
  const [nueva, setNueva] = useState('');

  const repetida = borrador.clases.some((c) => c.nombre.toLowerCase() === nueva.trim().toLowerCase());

  function agregar() {
    const nombre = nueva.trim();
    if (!nombre || repetida) return;
    actualizar({ clases: [...borrador.clases, { nombre, precio: '' }] });
    setNueva('');
  }

  const cambiarPrecio = (i: number, precio: string) =>
    actualizar({ clases: borrador.clases.map((c, j) => (j === i ? { ...c, precio: precio.replace(/[^0-9.]/g, '') } : c)) });

  const quitar = (i: number) => actualizar({ clases: borrador.clases.filter((_, j) => j !== i) });

  return (
    <PantallaPaso
      paso="clases"
      titulo="¿Qué clases das?"
      descripcion="Pon el precio mensual de cada una. Si cobras por paquete, lo configuras después en Ajustes."
      continuar={{ onPress: () => router.push('/registro/sucursales'), deshabilitado: borrador.clases.length === 0 }}
    >
      {borrador.clases.length > 0 && (
        <Grupo>
          {borrador.clases.map((c, i) => (
            <View key={c.nombre} style={estilos.fila}>
              <Texto variante="cuerpoFuerte" style={{ flex: 1 }} numberOfLines={1}>
                {c.nombre}
              </Texto>
              <View style={[estilos.precio, { borderColor: color.borde, backgroundColor: color.fondo }]}>
                <Texto variante="cuerpo" tono="tenue">
                  $
                </Texto>
                <TextInput
                  value={c.precio}
                  onChangeText={(v) => cambiarPrecio(i, v)}
                  placeholder="0"
                  placeholderTextColor={color.textoTenue}
                  keyboardType="decimal-pad"
                  accessibilityLabel={`Precio mensual de ${c.nombre}`}
                  style={[tipografia.cuerpoFuerte, { color: color.texto, width: 64, paddingVertical: 8, fontVariant: ['tabular-nums'] }]}
                />
              </View>
              <Pressable onPress={() => quitar(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Quitar ${c.nombre}`}>
                <X size={20} color={color.textoTenue} />
              </Pressable>
            </View>
          ))}
        </Grupo>
      )}

      <View style={estilos.agregar}>
        <View style={{ flex: 1 }}>
          <Campo
            etiqueta="Agregar otra clase"
            placeholder="Ej. Defensa personal"
            value={nueva}
            onChangeText={setNueva}
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={agregar}
            error={repetida && nueva.trim() ? 'Esa clase ya está en la lista' : null}
            maxLength={80}
          />
        </View>
        <Pressable
          onPress={agregar}
          disabled={!nueva.trim() || repetida}
          accessibilityRole="button"
          accessibilityLabel="Agregar clase"
          style={[estilos.botonMas, { backgroundColor: nueva.trim() && !repetida ? color.marca : color.borde }]}
        >
          <Plus size={22} color={nueva.trim() && !repetida ? color.sobreMarca : color.textoTenue} />
        </Pressable>
      </View>
    </PantallaPaso>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  precio: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10 },
  agregar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  botonMas: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
