import { router } from 'expo-router';
import { MapPin, Phone, Plus, WifiOff } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { crearSucursal, editarSucursal, eliminarSucursal, obtenerSucursales, type Sucursal } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { IconoEditar, IconoSucursal } from '@/components/iconos/Iconly';
import { useSeccionCristal } from '@/components/Cristal';
import { IconoTonal, LuzAmbiental } from '@/components/Tarjetas';
import { Boton, BotonIcono, Campo, confirmar, Encabezado, EstadoVacio, Fila, Grupo, Hoja, Insignia, Texto } from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';
import { alerta } from '@/utils/alerta';

// Formulario de la hoja: null = cerrada; sin id = sucursal nueva. borrable: ni la principal ni la actual
type Formulario = { id?: string; nombre: string; direccion: string; telefono: string; borrable?: boolean };

export default function SucursalesScreen() {
  const { color } = useTema();
  const { margen, esEscritorio, anchoSeccion } = useDiseno();
  const seccion = useSeccionCristal('Sucursales');
  const espacioBarra = useEspacioBarra();
  const { perfil, cambiarSucursal, viaje } = useSesion();
  const esDueno = perfil?.usuario.rol === 'Dueno';
  const activas = !!perfil?.academia.sucursalesActivas;
  const { datos, cargando, error, recargar } = useRecurso(obtenerSucursales, [] as Sucursal[]);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [guardando, setGuardando] = useState(false);

  if (!perfil) return null;
  const actual = datos.find((s) => s.actual);

  async function ir(sucursal: Sucursal) {
    if (sucursal.actual || viaje) return;
    try {
      await cambiarSucursal(sucursal);
    } catch (e) {
      alerta('No se pudo cambiar de sucursal', (e as Error).message);
    }
  }

  async function guardar() {
    if (!formulario) return;
    const datosSucursal = {
      nombre: formulario.nombre.trim(),
      direccion: formulario.direccion.trim() || undefined,
      telefono: formulario.telefono.trim() || undefined,
    };
    setGuardando(true);
    try {
      if (formulario.id) await editarSucursal(formulario.id, datosSucursal);
      else await crearSucursal(datosSucursal);
      setFormulario(null);
      await recargar();
    } catch (e) {
      alerta('No se pudo guardar la sucursal', (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  const nueva = () => setFormulario({ nombre: '', direccion: '', telefono: '' });
  const editar = (s: Sucursal) =>
    setFormulario({ id: s.id, nombre: s.nombre, direccion: s.direccion ?? '', telefono: s.telefono ?? '', borrable: !s.esPrincipal && !s.actual });

  function borrar() {
    if (!formulario?.id) return;
    const { id, nombre } = formulario;
    confirmar(
      `¿Borrar ${nombre}?`,
      `Se borran para siempre sus alumnos, cobros, clases, inventario, finanzas y asistencias. Las demás sucursales no cambian.`,
      'Borrar sucursal',
      async () => {
        await eliminarSucursal(id);
        setFormulario(null);
        await recargar();
      },
    );
  }

  const contenido = !activas ? (
    <EstadoVacio
      icono={IconoSucursal}
      titulo="Sucursales está apagado"
      mensaje="Actívalo en Ajustes si tu negocio tiene más de una sede."
      accion={{ titulo: 'Ir a Ajustes', onPress: () => router.navigate('/ajustes') }}
    />
  ) : !esDueno ? (
    <EstadoVacio
      icono={IconoSucursal}
      titulo={`Estás en ${perfil.academia.nombreSucursal ?? perfil.academia.nombre}`}
      mensaje="Solo la persona dueña del negocio puede cambiar de sucursal."
    />
  ) : error ? (
    <EstadoVacio icono={WifiOff} tono="error" titulo="No se pudieron cargar las sucursales" mensaje={error} accion={{ titulo: 'Reintentar', onPress: recargar }} />
  ) : (
    <>
      <Grupo>
        {datos.map((s) => {
          const detalle = [s.direccion, s.telefono].filter(Boolean).join(' · ');
          return (
            <FilaSucursal
              key={s.id}
              izquierda={<IconoTonal icono={IconoSucursal} tono={s.actual ? 'marca' : 'neutro'} />}
              onEditar={() => editar(s)}
              etiquetaEditar={`Editar ${s.nombre}`}
            >
              <Fila
                titulo={s.nombre}
                detalle={detalle || 'Sin dirección'}
                izquierda={<IconoTonal icono={IconoSucursal} tono={s.actual ? 'marca' : 'neutro'} />}
                onPress={s.actual ? undefined : () => ir(s)}
                derecha={<View />}
              >
                {(s.actual || s.esPrincipal) && (
                  <View style={estilos.insignias}>
                    {s.actual && <Insignia tono="marca" texto="Aquí estás" />}
                    {s.esPrincipal && s.nombre !== 'Principal' && <Insignia texto="Principal" />}
                  </View>
                )}
              </Fila>
            </FilaSucursal>
          );
        })}
      </Grupo>
      {datos.length > 0 && (
        <Texto variante="detalle" tono="suave" style={{ paddingHorizontal: 4 }}>
          Cada sucursal tiene sus propios alumnos, cobros, inventario y finanzas. El nombre, los colores y el logo son los mismos en todas.
        </Texto>
      )}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <LuzAmbiental />
      <Animated.ScrollView
        {...seccion.desplazamiento}
        contentContainerStyle={[
          estilos.contenido,
          { paddingHorizontal: margen, paddingTop: seccion.arriba, paddingBottom: espacioBarra, maxWidth: anchoSeccion + margen * 2 },
        ]}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} progressViewOffset={seccion.arriba} />}
      >
        <Encabezado
          titulo="Sucursales"
          detalle={activas && actual ? `Estás en ${actual.nombre}` : undefined}
          acciones={
            activas && esDueno ? (
              esEscritorio ? (
                <Boton titulo="Nueva sucursal" icono={Plus} variante="contorno" tamano="compacto" onPress={nueva} />
              ) : (
                <BotonIcono etiqueta="Nueva sucursal" icono={<Plus size={22} color={color.texto} />} onPress={nueva} />
              )
            ) : undefined
          }
        />
        {contenido}
      </Animated.ScrollView>

      <Hoja
        visible={!!formulario}
        titulo={formulario?.id ? 'Editar sucursal' : 'Nueva sucursal'}
        descripcion={formulario?.id ? undefined : 'Empieza con tus mismas clases, precios y marca; sus alumnos e inventario van aparte.'}
        onCerrar={() => setFormulario(null)}
        accion={{ titulo: formulario?.id ? 'Guardar' : 'Crear sucursal', onPress: guardar, cargando: guardando }}
      >
        {formulario && (
          <View style={{ gap: 12 }}>
            <Campo
              etiqueta="Nombre"
              placeholder="Ej. Norte"
              value={formulario.nombre}
              onChangeText={(v) => setFormulario({ ...formulario, nombre: v })}
              autoCapitalize="sentences"
              icono={IconoSucursal}
              maxLength={80}
            />
            <Campo
              etiqueta="Dirección (opcional)"
              placeholder="Calle, número y colonia"
              value={formulario.direccion}
              onChangeText={(v) => setFormulario({ ...formulario, direccion: v })}
              autoCapitalize="sentences"
              icono={MapPin}
              maxLength={200}
            />
            <Campo
              etiqueta="Teléfono (opcional)"
              value={formulario.telefono}
              onChangeText={(v) => setFormulario({ ...formulario, telefono: v })}
              keyboardType="phone-pad"
              icono={Phone}
              maxLength={30}
            />
            {formulario.borrable && <Boton titulo="Borrar sucursal" variante="peligro" tamano="compacto" onPress={borrar} />}
            {formulario.id && !formulario.borrable && (
              <Texto variante="pequeno" tono="tenue">
                {datos.find((s) => s.id === formulario.id)?.esPrincipal
                  ? 'La sucursal principal no se puede borrar.'
                  : 'Para borrar esta sucursal, primero cámbiate a otra.'}
              </Texto>
            )}
          </View>
        )}
      </Hoja>
      {seccion.barra}
    </View>
  );
}

// Fila de una sucursal con el lápiz al lado (no dentro): un botón no puede contener otro.
// `izquierda` solo sirve para que el grupo alinee la línea separadora con el texto.
function FilaSucursal({ children, onEditar, etiquetaEditar }: { children: ReactNode; izquierda: ReactNode; onEditar: () => void; etiquetaEditar: string }) {
  const { color } = useTema();
  return (
    <View style={estilos.filaSucursal}>
      <View style={{ flex: 1 }}>{children}</View>
      <Pressable
        onPress={onEditar}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={etiquetaEditar}
        style={({ pressed }) => [estilos.lapiz, { backgroundColor: color.fondo, opacity: pressed ? 0.6 : 1 }]}
      >
        <IconoEditar size={18} color={color.textoSuave} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  filaSucursal: { flexDirection: 'row', alignItems: 'center', paddingRight: 16 },
  contenido: { gap: 20, width: '100%', alignSelf: 'center' },
  insignias: { flexDirection: 'row', gap: 6, marginTop: 6 },
  lapiz: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
