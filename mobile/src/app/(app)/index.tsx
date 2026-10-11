import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { eliminarAlumno, obtenerAlumnos, type Alumno } from '@/api/endpoints';
import { Badge, Buscador, confirmar, formatoMoneda, Tarjeta, TextoVacio } from '@/components/ui';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';

export default function AlumnosScreen() {
  const tema = useTema();
  const { datos: alumnos, setDatos, cargando, error, recargar } = useRecurso(obtenerAlumnos, [] as Alumno[]);
  const [busqueda, setBusqueda] = useState('');

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? alumnos.filter((a) => a.nombre.toLowerCase().includes(q)) : alumnos;
  }, [alumnos, busqueda]);

  function darDeBaja(alumno: Alumno) {
    confirmar('¿Dar de baja?', `${alumno.nombre}\nSe eliminarán sus recibos.`, 'Sí, eliminar', async () => {
      await eliminarAlumno(alumno.id);
      setDatos((lista) => lista.filter((a) => a.id !== alumno.id));
    });
  }

  return (
    <FlatList
      data={filtrados}
      keyExtractor={(a) => a.id}
      contentContainerStyle={estilos.lista}
      refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={tema.primary} />}
      ListHeaderComponent={<Buscador value={busqueda} onChangeText={setBusqueda} placeholder="Buscar peleador..." />}
      ListEmptyComponent={<TextoVacio error={error} cargando={cargando} texto="No hay alumnos registrados." />}
      renderItem={({ item }) => (
        <Tarjeta style={{ gap: 10 }}>
          <View style={estilos.fila}>
            <View style={[estilos.avatar, { backgroundColor: tema.background }]}>
              <Text style={{ color: tema.text, fontWeight: '800', fontSize: 18 }}>{item.nombre.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[estilos.nombre, { color: tema.text }]}>{item.nombre}</Text>
              <Text style={{ color: tema.textMuted }}>{item.telefono}</Text>
            </View>
            <Pressable onPress={() => darDeBaja(item)} hitSlop={10}>
              <Text style={{ color: tema.primary, fontSize: 18 }}>🗑</Text>
            </Pressable>
          </View>

          <View style={estilos.disciplinas}>
            {item.disciplinas.map((d) => (
              <Badge key={d} texto={d} color={tema.primary} />
            ))}
          </View>

          <View style={estilos.fila}>
            <Text style={{ color: tema.textMuted, flex: 1 }}>
              PIN <Text style={{ color: tema.text, fontWeight: '700', fontFamily: 'monospace' }}>{item.claveKiosco}</Text>
            </Text>
            <Text style={{ color: tema.success, fontWeight: '800' }}>{formatoMoneda(item.costoMensualidad)}</Text>
          </View>
        </Tarjeta>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 16, gap: 12 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontSize: 17, fontWeight: '700' },
  disciplinas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
