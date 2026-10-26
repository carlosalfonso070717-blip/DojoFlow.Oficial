import { router, useLocalSearchParams } from 'expo-router';
import { BookOpen, SearchX, Users, WifiOff } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eliminarAlumno, obtenerAlumnos, type Alumno } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { IconoAgregarAlumno, IconoEliminar, IconoPagos } from '@/components/iconos/Iconly';
import { Indicador, LuzAmbiental, Rejilla, ResumenMovil } from '@/components/Tarjetas';
import {
  Avatar,
  Boton,
  BotonIcono,
  Buscador,
  CeldaLista,
  confirmar,
  Encabezado,
  EstadoVacio,
  Fila,
  formatoCorto,
  formatoMoneda,
  Grupo,
  Hoja,
  Insignia,
  ParDato,
  Superficie,
  Texto,
  useRejilla,
} from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';
import { useObjetivoTour } from '@/tour/Tour';
import { plural } from '@/utils/texto';

export default function AlumnosScreen() {
  const refTour = useObjetivoTour('alumnos');
  const { color } = useTema();
  const { margen, anchoSeccion, arriba, esEscritorio } = useDiseno();
  const rejilla = useRejilla();
  const espacioBarra = useEspacioBarra();
  const { perfil } = useSesion();
  const termino = perfil?.academia.terminoAlumno || 'Alumno';
  const { datos: alumnos, setDatos, cargando, error, recargar } = useRecurso(obtenerAlumnos, [] as Alumno[]);
  const [busqueda, setBusqueda] = useState('');

  // La búsqueda de la barra lateral (web) llega como /alumnos?q=...; cada búsqueda nueva reemplaza la actual
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [qAplicada, setQAplicada] = useState<string | undefined>(undefined);
  if (q !== qAplicada) {
    setQAplicada(q);
    if (q !== undefined) setBusqueda(q);
  }
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

  // Resumen para el escritorio
  const cuotaMensual = alumnos.reduce((s, a) => s + a.costoMensualidad, 0);
  const clases = new Set(alumnos.flatMap((a) => a.disciplinas)).size;

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
      <LuzAmbiental />
      <FlatList
        key={rejilla.clave}
        {...rejilla.props}
        data={filtrados}
        keyExtractor={(a) => a.id}
        contentContainerStyle={[estilos.lista, { paddingHorizontal: margen, paddingTop: arriba, paddingBottom: espacioBarra, maxWidth: anchoSeccion + margen * 2 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} />}
        ListHeaderComponent={
          <View style={estilos.cabecera} ref={refTour} collapsable={false}>
            <Encabezado
              titulo={plural(termino)}
              detalle={alumnos.length ? `${alumnos.length} en total` : undefined}
              acciones={
                esEscritorio ? (
                  <Boton titulo={`Inscribir ${termino.toLowerCase()}`} icono={IconoAgregarAlumno} tamano="compacto" onPress={inscribir} />
                ) : (
                  <BotonIcono
                    destacado
                    etiqueta={`Inscribir ${termino.toLowerCase()}`}
                    icono={<IconoAgregarAlumno size={22} color={color.sobreMarca} />}
                    onPress={inscribir}
                  />
                )
              }
            />
            {esEscritorio && alumnos.length > 0 && (
              <Rejilla columnas={4}>
                <Indicador icono={Users} etiqueta={`${plural(termino)} inscritos`} valor={String(alumnos.length)} />
                <Indicador icono={IconoPagos} tono="exito" etiqueta="Cuotas al mes" valor={formatoMoneda(cuotaMensual)} detalle="Si todos pagan" />
                <Indicador
                  icono={IconoPagos}
                  tono="neutro"
                  etiqueta="Cuota promedio"
                  valor={formatoMoneda(alumnos.length ? cuotaMensual / alumnos.length : 0)}
                />
                <Indicador icono={BookOpen} tono="aviso" etiqueta="Clases con inscritos" valor={String(clases)} />
              </Rejilla>
            )}
            {!esEscritorio && alumnos.length > 0 && (
              <ResumenMovil
                sangria={margen}
                datos={[
                  { etiqueta: 'Inscritos', valor: String(alumnos.length), tono: 'marca' },
                  { etiqueta: 'Cuotas al mes', valor: formatoCorto(cuotaMensual), tono: 'exito' },
                  { etiqueta: 'Clases activas', valor: String(clases), tono: 'aviso' },
                ]}
              />
            )}
            {alumnos.length > 0 && <Buscador value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre o PIN" />}
          </View>
        }
        ListEmptyComponent={vacio}
        renderItem={({ item, index }) => (
          <CeldaLista indice={index} total={filtrados.length} columnas={rejilla.columnas}>
            <Fila
              titulo={item.nombre}
              detalle={
                esEscritorio
                  ? `PIN ${item.claveKiosco} · ${formatoMoneda(item.costoMensualidad)} al mes · ${item.disciplinas.join(', ')}`
                  : `PIN ${item.claveKiosco} · ${formatoMoneda(item.costoMensualidad)} al mes`
              }
              izquierda={<Avatar nombre={item.nombre} />}
              onPress={() => setSeleccionado(item)}
            >
              {/* En el celular, sus clases como etiquetas debajo del nombre */}
              {!esEscritorio && item.disciplinas.length > 0 && (
                <View style={estilos.clasesFila}>
                  {item.disciplinas.map((d) => (
                    <Insignia key={d} texto={d} />
                  ))}
                </View>
              )}
            </Fila>
          </CeldaLista>
        )}
      />

      <Hoja visible={!!seleccionado} titulo={seleccionado?.nombre ?? ''} onCerrar={() => setSeleccionado(null)}>
        {seleccionado && (
          <>
            <Superficie style={{ alignItems: 'center', gap: 4, paddingVertical: 20 }}>
              <Texto variante="detalle" tono="suave">
                PIN para registrar asistencia
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
  clasesFila: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  clases: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', flexShrink: 1 },
});
