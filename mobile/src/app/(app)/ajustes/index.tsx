import { router } from 'expo-router';
import { BookOpen, Compass, Palette, SunMoon, Tablet } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import {
  obtenerClases,
  obtenerConfiguracion,
  quitarFotoPerfil,
  quitarLogo,
  subirFotoPerfil,
  subirLogo,
  type Clase,
  type ConfiguracionAcademia,
} from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { IconoCerrarSesion, IconoPagos } from '@/components/iconos/Iconly';
import { PantallaSecundaria } from '@/components/PantallaSecundaria';
import { Segmentos } from '@/components/Segmentos';
import { Avatar, Boton, confirmar, Fila, Grupo, Hoja, Texto } from '@/components/ui';
import { useRecurso } from '@/hooks/useRecurso';
import { cambiarPreferenciaTema, usePreferenciaTema, useTema, type PreferenciaTema } from '@/theme';
import { useTour } from '@/tour/Tour';
import { elegirLogo, type ArchivoLogo } from '@/utils/logo';
import { plural } from '@/utils/texto';
import { alerta } from '@/utils/alerta';

type Datos = { config: ConfiguracionAcademia | null; clases: Clase[] };

const cargar = async (): Promise<Datos> => {
  const [config, clases] = await Promise.all([obtenerConfiguracion(), obtenerClases()]);
  return { config, clases };
};

// La misma hoja sirve para el logo de la academia y para la foto de perfil;
// el tipo se conserva al cerrar para que el título no cambie durante la animación
type TipoFoto = 'logo' | 'perfil';

export default function AjustesScreen() {
  const { color } = useTema();
  const preferencia = usePreferenciaTema();
  const { perfil, recargarPerfil, cerrarSesion, vincularKiosco } = useSesion();
  const { iniciar: iniciarTour } = useTour();
  const { datos } = useRecurso(cargar, { config: null, clases: [] } as Datos);
  const [tipoFoto, setTipoFoto] = useState<TipoFoto>('logo');
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  if (!perfil) return null;
  const { academia, usuario } = perfil;
  const esDueno = usuario.rol === 'Dueno';
  const cobro = datos.config?.cobro;
  const activas = datos.clases.filter((c) => c.activa).length;

  const esLogo = tipoFoto === 'logo';
  const abrirHoja = (tipo: TipoFoto) => {
    setTipoFoto(tipo);
    setHojaAbierta(true);
  };
  const fotoActual = esLogo ? academia.logoUrl : usuario.fotoUrl;

  async function cambiarFoto() {
    setSubiendo(true);
    try {
      const archivo: ArchivoLogo | null = await elegirLogo();
      if (archivo) {
        if (esLogo) await subirLogo(archivo);
        else await subirFotoPerfil(archivo);
        await recargarPerfil();
        setHojaAbierta(false);
      }
    } catch (e) {
      alerta(esLogo ? 'No se pudo subir el logo' : 'No se pudo subir la foto', (e as Error).message);
    } finally {
      setSubiendo(false);
    }
  }

  function borrarFoto() {
    confirmar(
      esLogo ? '¿Quitar el logo?' : '¿Quitar tu foto?',
      esLogo ? 'Se mostrarán las iniciales de la academia.' : 'Se mostrarán tus iniciales.',
      'Quitar',
      async () => {
        if (esLogo) await quitarLogo();
        else await quitarFotoPerfil();
        await recargarPerfil();
        setHojaAbierta(false);
      },
    );
  }

  async function abrirKiosco() {
    try {
      await vincularKiosco();
      router.push('/kiosco');
    } catch (e) {
      alerta('No se pudo abrir el kiosco', (e as Error).message);
    }
  }

  return (
    <PantallaSecundaria titulo="Ajustes" principal>
      <Grupo titulo="Tu academia">
        <Fila
          titulo={academia.nombre}
          detalle={esDueno ? 'Toca para cambiar el logo' : academia.tipoNegocio}
          izquierda={<Avatar nombre={academia.nombre} logoUrl={academia.logoUrl} tamano={52} />}
          onPress={esDueno ? () => abrirHoja('logo') : undefined}
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

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
          <SunMoon size={16} color={color.textoSuave} />
          <Texto variante="detalle" tono="suave">
            Apariencia
          </Texto>
        </View>
        <Segmentos<PreferenciaTema>
          valor={preferencia}
          onCambio={cambiarPreferenciaTema}
          opciones={[
            { valor: 'sistema', etiqueta: 'Automática' },
            { valor: 'claro', etiqueta: 'Clara' },
            { valor: 'oscuro', etiqueta: 'Oscura' },
          ]}
        />
      </View>

      <Grupo titulo="Tu cuenta">
        <Fila
          titulo={usuario.nombre}
          detalle={usuario.fotoUrl ? usuario.email : 'Toca para poner tu foto de perfil'}
          izquierda={<Avatar nombre={usuario.nombre} logoUrl={usuario.fotoUrl} tamano={44} />}
          onPress={() => abrirHoja('perfil')}
        />
        <Fila
          titulo="Ver el recorrido de nuevo"
          izquierda={<Compass size={22} color={color.texto} />}
          onPress={() => {
            // Si se llegó directo a /ajustes (p. ej. desde la barra lateral o la URL) no hay a dónde regresar
            if (router.canGoBack()) router.back();
            else router.navigate('/');
            setTimeout(iniciarTour, 450);
          }}
        />
        <Fila
          titulo="Cerrar sesión"
          izquierda={<IconoCerrarSesion size={22} color={color.peligro} />}
          onPress={() => confirmar('¿Cerrar sesión?', undefined, 'Cerrar sesión', () => cerrarSesion())}
        />
      </Grupo>

      <Hoja
        visible={hojaAbierta}
        titulo={esLogo ? 'Logo de la academia' : 'Tu foto de perfil'}
        descripcion="Funciona mejor una imagen cuadrada."
        onCerrar={() => setHojaAbierta(false)}
      >
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Avatar nombre={esLogo ? academia.nombre : usuario.nombre} logoUrl={fotoActual} tamano={120} />
        </View>
        <Boton titulo={fotoActual ? 'Elegir otra imagen' : 'Elegir imagen'} onPress={cambiarFoto} cargando={subiendo} />
        {fotoActual && <Boton titulo={esLogo ? 'Quitar logo' : 'Quitar foto'} variante="peligro" onPress={borrarFoto} />}
      </Hoja>
    </PantallaSecundaria>
  );
}
