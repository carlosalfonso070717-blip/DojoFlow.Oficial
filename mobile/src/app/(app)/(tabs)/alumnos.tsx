import { router } from 'expo-router';
import { Plus, SearchX, Trash2, Users, WifiOff } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eliminarAlumno, obtenerAlumnos, type Alumno } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import {
  Avatar,
  BotonIcono,
  Buscador,
  confirmar,
  Encabezado,
  EstadoVacio,
  Fila,
  formatoMoneda,
  Insignia,
  ItemGrupo,
} from '@/components/ui';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';
import { plural } from '@/utils/texto';

export default function AlumnosScreen() {
  const { color, espacio } = useTema();
  const { perfil } = useSesion();
  const termino = perfil?.academia.terminoAlumno || 'Alumno';
  const { datos: alumnos, setDatos, cargando, error, recargar } = useRecurso(obtenerAlumnos, [] as Alumno[]);
  const [busqueda, setBusqueda] = useState('');

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return alumnos;
    return alumnos.filter((a) => a.nombre.toLowerCase().includes(q) || String(a.claveKiosco).includes(q));
  }, [alumnos, busqueda]);

  function darDeBaja(alumno: Alumno) {
    confirmar(`¿Dar de baja a ${alumno.nombre}?`, 'También se eliminarán sus recibos.', 'Dar de baja', async () => {
      await eliminarAlumno(alumno.id);
      setDatos((lista) => lista.filter((a) => a.id !== alumno.id));
    });
  }

  const vacio = error ? (
    <EstadoVacio icono={WifiOff} tono="error" titulo="No se pudo cargar la lista" mensaje={error} accion={{ titulo: 'Reintentar', onPress: recargar }} />
  ) : busqueda ? (
    <EstadoVacio icono={SearchX} titulo="Sin resultados" mensaje={`Nadie coincide con "${busqueda}".`} />
  ) : cargando ? null : (
    <EstadoVacio
      icono={Users}
      titulo={`Aún no hay ${plural(termino).toLowerCase()}`}
      mensaje="Inscribe al primero para generar su PIN de acceso y su primer recibo."
      accion={{ titulo: `Inscribir ${termino.toLowerCase()}`, onPress: () => router.push('/registrar') }}
    />
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.fondo }}>
      <FlatList
        data={filtrados}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: espacio.l, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} />}
        ListHeaderComponent={
          <View style={estilos.cabecera}>
            <Encabezado
              titulo={plural(termino)}
              detalle={alumnos.length ? `${alumnos.length} en total` : undefined}
              acciones={
                <BotonIcono
                  destacado
                  etiqueta={`Inscribir ${termino.toLowerCase()}`}
                  icono={<Plus size={22} color={color.sobreMarca} strokeWidth={2.4} />}
                  onPress={() => router.push('/registrar')}
                />
              }
            />
            {alumnos.length > 0 && (
              <Buscador value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre o PIN" />
            )}
          </View>
        }
        ListEmptyComponent={vacio}
        renderItem={({ item, index }) => (
          <ItemGrupo indice={index} total={filtrados.length}>
            <Fila
              titulo={item.nombre}
              detalle={`${formatoMoneda(item.costoMensualidad)} al mes`}
              izquierda={<Avatar nombre={item.nombre} />}
              derecha={
                <Pressable onPress={() => darDeBaja(item)} hitSlop={12} accessibilityRole="button" accessibilityLabel={`Dar de baja a ${item.nombre}`}>
                  <Trash2 size={19} color={color.textoTenue} />
                </Pressable>
              }
            >
              <View style={estilos.clases}>
                <Insignia texto={`PIN ${item.claveKiosco}`} tono="marca" />
                {item.disciplinas.map((d) => (
                  <Insignia key={d} texto={d} tono="neutro" />
                ))}
              </View>
            </Fila>
          </ItemGrupo>
        )}
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  cabecera: { gap: 16, marginBottom: 16 },
  clases: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
});
