import { router, Stack } from 'expo-router';
import { BookOpen, CircleCheck, Phone } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { obtenerClases, registrarAlumno, type AlumnoRegistrado, type Clase } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { BotonAtras } from '@/components/BotonAtras';
import { useDiseno } from '@/hooks/useDiseno';
import { Boton, Campo, Chip, EstadoVacio, Superficie, Texto } from '@/components/ui';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';
import { alerta } from '@/utils/alerta';

export default function InscribirScreen() {
  const { color, espacio, radio } = useTema();
  const { margen, arriba } = useDiseno();
  const { perfil } = useSesion();
  const termino = (perfil?.academia.terminoAlumno || 'Alumno').toLowerCase();
  const { datos: clases, cargando: cargandoClases } = useRecurso(obtenerClases, [] as Clase[]);
  const clasesActivas = useMemo(() => clases.filter((c) => c.activa), [clases]);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<AlumnoRegistrado | null>(null);

  function alternar(clase: string) {
    setElegidas((sel) => (sel.includes(clase) ? sel.filter((x) => x !== clase) : [...sel, clase]));
  }

  async function inscribir() {
    if (!nombre.trim() || !apellido.trim()) {
      alerta('Faltan datos', 'Escribe nombre y apellido.');
      return;
    }
    if (elegidas.length === 0) {
      alerta('Faltan datos', 'Elige al menos una clase.');
      return;
    }
    setEnviando(true);
    try {
      setResultado(await registrarAlumno({ nombre: nombre.trim(), apellido: apellido.trim(), telefono: telefono.trim(), disciplinas: elegidas }));
    } catch (e) {
      alerta('No se pudo inscribir', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  function otraInscripcion() {
    setResultado(null);
    setNombre('');
    setApellido('');
    setTelefono('');
    setElegidas([]);
  }

  const titulo = <Stack.Screen options={{ title: `Inscribir ${termino}` }} />;

  // Confirmación: el PIN es lo que la persona necesita llevarse
  if (resultado) {
    return (
      <View style={[estilos.exito, { padding: espacio.xl }]}>
        {titulo}
        <Animated.View entering={ZoomIn.springify().damping(14)}>
          <CircleCheck size={56} color={color.exito} />
        </Animated.View>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Texto variante="encabezado" style={{ textAlign: 'center' }}>
            Inscripción lista
          </Texto>
          <Texto variante="cuerpo" tono="suave" style={{ textAlign: 'center' }}>
            {resultado.nombreCompleto}
          </Texto>
        </View>
        <Superficie style={{ alignItems: 'center', gap: 6, alignSelf: 'stretch', borderRadius: radio.xl }}>
          <Texto variante="detalle" tono="suave">
            PIN para el kiosco
          </Texto>
          <Texto variante="cifra" cifras style={{ fontSize: 48, lineHeight: 54, letterSpacing: 6 }} selectable>
            {resultado.claveKioscoAsignada}
          </Texto>
          <Texto variante="detalle" tono="suave">
            Cuota mensual: {resultado.costoMensualidadAsignado}
          </Texto>
        </Superficie>
        <View style={{ alignSelf: 'stretch', gap: 10 }}>
          <Boton titulo="Listo" onPress={() => router.back()} />
          <Boton titulo={`Inscribir otro ${termino}`} variante="contorno" onPress={otraInscripcion} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {titulo}
      <ScrollView
        contentContainerStyle={[estilos.contenido, Platform.OS === 'web' ? { paddingHorizontal: margen, paddingTop: 8 + arriba } : { padding: espacio.l }]}
        keyboardShouldPersistTaps="handled"
      >
        {Platform.OS === 'web' && (
          <View style={{ gap: 16 }}>
            <BotonAtras alterno="/" />
            <Texto variante="titulo" accessibilityRole="header">
              Inscribir {termino}
            </Texto>
          </View>
        )}
        <View style={{ gap: 14 }}>
          <View style={estilos.fila}>
            <View style={{ flex: 1 }}>
              <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} autoCapitalize="words" autoFocus />
            </View>
            <View style={{ flex: 1 }}>
              <Campo etiqueta="Apellido" value={apellido} onChangeText={setApellido} autoCapitalize="words" />
            </View>
          </View>
          <Campo
            etiqueta="Teléfono"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            icono={Phone}
            ayuda="Opcional, para contactarle sobre sus pagos."
          />
        </View>

        <View style={{ gap: 10 }}>
          <Texto variante="subtitulo">Clases</Texto>
          {clasesActivas.length === 0 && !cargandoClases ? (
            <EstadoVacio icono={BookOpen} titulo="Tu academia aún no tiene clases" mensaje="Agrégalas en Ajustes para poder inscribir." />
          ) : (
            <View style={estilos.chips}>
              {clasesActivas.map((c) => (
                <Chip key={c.id} texto={c.nombre} activo={elegidas.includes(c.nombre)} onPress={() => alternar(c.nombre)} />
              ))}
            </View>
          )}
        </View>

        <Boton titulo={`Inscribir ${termino}`} onPress={inscribir} cargando={enviando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  // En pantallas anchas el formulario conserva un ancho de lectura
  contenido: { gap: 28, paddingBottom: 40, width: '100%', maxWidth: 640, alignSelf: 'center' },
  fila: { flexDirection: 'row', gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exito: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
});
