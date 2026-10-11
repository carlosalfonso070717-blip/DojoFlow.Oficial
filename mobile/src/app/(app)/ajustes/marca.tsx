import { router } from 'expo-router';
import { School } from 'lucide-react-native';
import { useState } from 'react';
import { actualizarMarca } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { PantallaSecundaria } from '@/components/PantallaSecundaria';
import { SelectorColores } from '@/components/SelectorColores';
import { Boton, Campo, Credencial, DatoCredencial } from '@/components/ui';
import { plural } from '@/utils/texto';
import { alerta } from '@/utils/alerta';

export default function MarcaScreen() {
  const { perfil, recargarPerfil } = useSesion();
  const academia = perfil?.academia;
  const [nombre, setNombre] = useState(academia?.nombre ?? '');
  const [termino, setTermino] = useState(academia?.terminoAlumno ?? 'Alumno');
  const [primario, setPrimario] = useState(academia?.colorPrimario ?? '#d90429');
  const [secundario, setSecundario] = useState(academia?.colorSecundario ?? '#14161a');
  const [guardando, setGuardando] = useState(false);

  if (!academia) return null;

  const cambios =
    nombre.trim() !== academia.nombre ||
    termino.trim() !== academia.terminoAlumno ||
    primario !== academia.colorPrimario ||
    secundario !== academia.colorSecundario;

  async function guardar() {
    setGuardando(true);
    try {
      await actualizarMarca({ nombre: nombre.trim(), terminoAlumno: termino.trim(), colorPrimario: primario, colorSecundario: secundario });
      // Al recargar el perfil, toda la app se vuelve a pintar con los colores nuevos
      await recargarPerfil();
      router.back();
    } catch (e) {
      alerta('No se pudieron guardar los cambios', (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <PantallaSecundaria
      titulo="Nombre y colores"
      descripcion="Así se ve tu academia en la app, el kiosco y la credencial."
      pie={<Boton titulo="Guardar cambios" onPress={guardar} cargando={guardando} deshabilitado={!cambios || nombre.trim().length < 2 || termino.trim().length < 2} />}
    >
      <Credencial
        academia={{ ...academia, nombre: nombre.trim() || academia.nombre, colorPrimario: primario, colorSecundario: secundario, terminoAlumno: termino }}
      >
        <DatoCredencial valor="24" etiqueta={plural(termino.trim() || 'Alumno')} fondo={secundario} />
        <DatoCredencial valor="$18.5k" etiqueta="Ingresos del mes" fondo={secundario} />
      </Credencial>

      <Campo etiqueta="Nombre de la academia" value={nombre} onChangeText={setNombre} autoCapitalize="words" icono={School} maxLength={120} />
      <Campo
        etiqueta="Cómo llamas a tus alumnos"
        ayuda={`En singular. Se verá como "${plural(termino.trim() || 'Alumno')}".`}
        value={termino}
        onChangeText={setTermino}
        autoCapitalize="words"
        maxLength={40}
      />

      <SelectorColores primario={primario} secundario={secundario} onPrimario={setPrimario} onSecundario={setSecundario} />
    </PantallaSecundaria>
  );
}
