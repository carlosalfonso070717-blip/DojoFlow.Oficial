import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DISCIPLINAS, registrarAlumno } from '@/api/endpoints';
import { Boton, Campo, Tarjeta } from '@/components/ui';
import { useTema } from '@/theme';

export default function RegistrarScreen() {
  const tema = useTema();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);

  function alternar(d: string) {
    setDisciplinas((sel) => (sel.includes(d) ? sel.filter((x) => x !== d) : [...sel, d]));
  }

  async function registrar() {
    if (disciplinas.length === 0) {
      Alert.alert('Error', 'Selecciona al menos una disciplina');
      return;
    }
    setCargando(true);
    try {
      const r = await registrarAlumno({ nombre, apellido, telefono, disciplinas });
      Alert.alert(
        'Peleador registrado',
        `Nombre: ${r.nombreCompleto}\nPIN de acceso: ${r.claveKioscoAsignada}\nCuota: $${r.costoMensualidadAsignado}`,
      );
      setNombre('');
      setApellido('');
      setTelefono('');
      setDisciplinas([]);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        <Tarjeta style={{ gap: 16 }}>
          <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} autoCapitalize="words" />
          <Campo etiqueta="Apellido" value={apellido} onChangeText={setApellido} autoCapitalize="words" />
          <Campo etiqueta="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />

          <Text style={[estilos.etiqueta, { color: tema.textMuted }]}>Disciplinas</Text>
          <View style={estilos.chips}>
            {DISCIPLINAS.map((d) => {
              const activa = disciplinas.includes(d);
              return (
                <Pressable
                  key={d}
                  onPress={() => alternar(d)}
                  style={[
                    estilos.chip,
                    { borderColor: tema.primary, backgroundColor: activa ? tema.primary : 'transparent' },
                  ]}
                >
                  <Text style={{ color: activa ? '#fff' : tema.primary, fontWeight: '700' }}>{d}</Text>
                </Pressable>
              );
            })}
          </View>

          <Boton titulo="Registrar peleador" onPress={registrar} cargando={cargando} />
        </Tarjeta>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
  etiqueta: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
});
