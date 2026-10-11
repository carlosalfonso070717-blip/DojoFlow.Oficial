import { router } from 'expo-router';
import { BookOpen, Compass, Palette, Tablet } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { obtenerClases, obtenerConfiguracion, quitarLogo, subirLogo, type Clase, type ConfiguracionAcademia } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { IconoCerrarSesion, IconoPagos } from '@/components/iconos/Iconly';
import { PantallaSecundaria } from '@/components/PantallaSecundaria';
import { Avatar, Boton, confirmar, Fila, Grupo, Hoja, Texto } from '@/components/ui';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';
import { useTour } from '@/tour/Tour';
import { elegirLogo } from '@/utils/logo';
import { plural } from '@/utils/texto';

type Datos = { config: ConfiguracionAcademia | null; clases: Clase[] };

const cargar = async (): Promise<Datos> => {
  const [config, clases] = await Promise.all([obtenerConfiguracion(), obtenerClases()]);
  return { config, clases };
};

export default function AjustesScreen() {
  const { color } = useTema();
  const { perfil, recargarPerfil, cerrarSesion, vincularKiosco } = useSesion();
  const { iniciar: iniciarTour } = useTour();
  const { datos } = useRecurso(cargar, { config: null, clases: [] } as Datos);
  const [hojaLogo, setHojaLogo] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  if (!perfil) return null;
  const { academia, usuario } = perfil;
  const esDueno = usuario.rol === 'Dueno';
  const cobro = datos.config?.cobro;
  const activas = datos.clases.filter((c) => c.activa).length;

  async function cambiarLogo() {
    setSubiendo(true);
    try {
      const logo = await elegirLogo();
      if (logo) {
        await subirLogo(logo);
        await recargarPerfil();
      }
      setHojaLogo(false);
    } catch (e) {
      Alert.alert('No se pudo subir el logo', (e as Error).message);
    } finally {
      setSubiendo(false);
    }
  }

  function borrarLogo() {
    confirmar('¿Quitar el logo?', 'Se mostrarán las iniciales de la academia.', 'Quitar', async () => {
      await quitarLogo();
      await recargarPerfil();
      setHojaLogo(false);
    });
  }

  async function abrirKiosco() {
    try {
      await vincularKiosco();
      router.push('/kiosco');
    } catch (e) {
      Alert.alert('No se pudo abrir el kiosco', (e as Error).message);
    }
  }

  return (
    <PantallaSecundaria titulo="Ajustes">
      <Grupo titulo="Tu academia">
        <Fila
          titulo={academia.nombre}
          detalle={esDueno ? 'Toca para cambiar el logo' : academia.tipoNegocio}
          izquierda={<Avatar nombre={academia.nombre} logoUrl={academia.logoUrl} tamano={52} />}
          onPress={esDueno ? () => setHojaLogo(true) : undefined}
        />
        {esDueno && (
          <Fila
            titulo="Nombre y colores"
            detalle={`Llamas a tus alumnos "${plural(academia.terminoAlumno).toLowerCase()}"`}
            izquierda={<Palette size={22} color={color.texto} />}
            onPress={() => router.push('/ajustes/marca')}
          />
        )}
        {esDueno && (
          <Fila
            titulo="Clases y precios"
            detalle={datos.config ? `${activas} ${activas === 1 ? 'clase activa' : 'clases activas'}` : undefined}
            izquierda={<BookOpen size={22} color={color.texto} />}
            onPress={() => router.push('/ajustes/clases')}
          />
        )}
        {esDueno && (
          <Fila
            titulo="Forma de cobro"
            detalle={cobro ? `${cobro.modoCobro === 'Paquete' ? 'Por paquete' : 'Por clase'}, vence el día ${cobro.diaVencimiento}` : undefined}
            izquierda={<IconoPagos size={22} color={color.texto} />}
            onPress={() => router.push('/ajustes/cobro')}
          />
        )}
      </Grupo>

      {!esDueno && (
        <Texto variante="detalle" tono="suave">
          Solo la persona dueña de la academia puede cambiar colores, clases y precios.
        </Texto>
      )}

      <Grupo titulo="Recepción">
        <Fila
          titulo="Abrir kiosco"
          detalle="Vincula esta tablet para registrar asistencias con PIN"
          izquierda={<Tablet size={22} color={color.texto} />}
          onPress={abrirKiosco}
        />
      </Grupo>

      <Grupo titulo="Tu cuenta">
        <Fila titulo={usuario.nombre} detalle={usuario.email} izquierda={<Avatar nombre={usuario.nombre} tamano={40} />} />
        <Fila
          titulo="Ver el recorrido de nuevo"
          izquierda={<Compass size={22} color={color.texto} />}
          onPress={() => {
            router.back();
            setTimeout(iniciarTour, 450);
          }}
        />
        <Fila
          titulo="Cerrar sesión"
          izquierda={<IconoCerrarSesion size={22} color={color.peligro} />}
          onPress={() => confirmar('¿Cerrar sesión?', undefined, 'Cerrar sesión', () => cerrarSesion())}
        />
      </Grupo>

      <Hoja visible={hojaLogo} titulo="Logo de la academia" descripcion="Funciona mejor una imagen cuadrada." onCerrar={() => setHojaLogo(false)}>
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Avatar nombre={academia.nombre} logoUrl={academia.logoUrl} tamano={120} />
        </View>
        <Boton titulo={academia.logoUrl ? 'Elegir otra imagen' : 'Elegir de mi galería'} onPress={cambiarLogo} cargando={subiendo} />
        {academia.logoUrl && <Boton titulo="Quitar logo" variante="peligro" onPress={borrarLogo} />}
      </Hoja>
    </PantallaSecundaria>
  );
}
