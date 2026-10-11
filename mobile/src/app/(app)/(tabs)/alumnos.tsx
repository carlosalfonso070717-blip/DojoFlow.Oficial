import { router } from 'expo-router';
import { SearchX, Users, WifiOff } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eliminarAlumno, obtenerAlumnos, type Alumno } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { IconoAgregarAlumno, IconoEliminar } from '@/components/iconos/Iconly';
import {
  Avatar,
  Boton,
  BotonIcono,
  Buscador,
  confirmar,
  Encabezado,
  EstadoVacio,
  Fila,
  formatoMoneda,
  Grupo,
  Hoja,
  Insignia,
  ItemGrupo,
  ParDato,
  Superficie,
  Texto,
} from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';
import { plural } from '@/utils/texto';

export default function AlumnosScreen() {
  const { color } = useTema();
  const { margen, maximo } = useDiseno();
  const espacioBarra = useEspacioBarra();
  const { perfil } = useSesion();
  const termino = perfil?.academia.terminoAlumno || 'Alumno';
  const { datos: alumnos, setDatos, cargando, error, recargar } = useRecurso(obtenerAlumnos, [] as Alumno[]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<Alumno | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return alumnos;
    return alumnos.filter((a) => a.nombre.toLowerCase().includes(q) || String(a.claveKiosco).includes(q));
  }, [alumnos, busqueda]);

  function darDeBaja(alumno: Alumno) {
    confirmar(`¿Dar de baja a ${alumno.nombre}?`, 'También se eliminarán sus recibos.', 'Dar de baja', async () => {
      await eliminarAlumno(alumno.id);
      setSeleccionado(null);
      setDatos((lista) => lista.filter((a) => a.id !== alumno.id));
    });
  }

  const inscribir = () => router.push('/registrar');

  const vacio = error ? (
    <EstadoVacio icono={WifiOff} tono="error" titulo="No se pudo cargar la lista" mensaje={error} accion={{ titulo: 'Reintentar', onPress: recargar }} />
  ) : busqueda ? (
    <EstadoVacio icono={SearchX} titulo="Sin resultados" mensaje={`Nadie coincide con "${busqueda}".`} />
  ) : cargando ? null : (
    <EstadoVacio
      icono={Users}
      titulo={`Aún no hay ${plural(termino).toLowerCase()}`}
      mensaje="Inscribe al primero para generar su PIN de acceso y su primer recibo."
      accion={{ titulo: `Inscribir ${termino.toLowerCase()}`, onPress: inscribir }}
    />
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.fondo }}>
      <FlatList
        data={filtrados}
        keyExtractor={(a) => a.id}
        contentContainerStyle={[estilos.lista, { paddingHorizontal: margen, paddingBottom: espacioBarra, maxWidth: maximo + margen * 2 }]}
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
                  icono={<IconoAgregarAlumno size={22} color={color.sobreMarca} />}
                  onPress={inscribir}
                />
              }
            />
            {alumnos.length > 0 && <Buscador value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre o PIN" />}
          </View>
        }
        ListEmptyComponent={vacio}
        renderItem={({ item, index }) => (
          <ItemGrupo indice={index} total={filtrados.length}>
            <Fila
              titulo={item.nombre}
              detalle={`PIN ${item.claveKiosco}`}
              izquierda={<Avatar nombre={item.nombre} />}
              onPress={() => setSeleccionado(item)}
            />
          </ItemGrupo>
        )}
      />

      <Hoja visible={!!seleccionado} titulo={seleccionado?.nombre ?? ''} onCerrar={() => setSeleccionado(null)}>
        {seleccionado && (
          <>
            <Superficie style={{ alignItems: 'center', gap: 4, paddingVertical: 20 }}>
              <Texto variante="detalle" tono="suave">
                PIN para el kiosco
              </Texto>
              <Texto variante="cifra" cifras style={{ fontSize: 40, lineHeight: 46, letterSpacing: 6 }} selectable>
                {seleccionado.claveKiosco}
              </Texto>
            </Superficie>
            <Grupo>
              <ParDato etiqueta="Cuota mensual" valor={formatoMoneda(seleccionado.costoMensualidad)} />
              {seleccionado.telefono ? <ParDato etiqueta="Teléfono" valor={seleccionado.telefono} /> : null}
              <ParDato etiqueta="Clases">
                <View style={estilos.clases}>
                  {seleccionado.disciplinas.map((d) => (
                    <Insignia key={d} texto={d} />
                  ))}
                </View>
              </ParDato>
            </Grupo>
            <Boton titulo="Dar de baja" icono={IconoEliminar} variante="peligro" onPress={() => darDeBaja(seleccionado)} />
          </>
        )}
      </Hoja>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  lista: { width: '100%', alignSelf: 'center' },
  cabecera: { gap: 16, marginBottom: 16 },
  clases: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', flexShrink: 1 },
});
