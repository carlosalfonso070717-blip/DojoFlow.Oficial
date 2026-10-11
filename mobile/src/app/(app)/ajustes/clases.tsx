import { BookOpen, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { crearClase, editarClase, eliminarClase, obtenerClases, type Clase } from '@/api/endpoints';
import { IconoEliminar } from '@/components/iconos/Iconly';
import { PantallaSecundaria } from '@/components/PantallaSecundaria';
import { Boton, BotonIcono, Campo, confirmar, EstadoVacio, Fila, formatoMoneda, Grupo, Hoja, Insignia, ParDato, Texto } from '@/components/ui';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';

type Edicion = { clase: Clase | null; nombre: string; precio: string; activa: boolean };

export default function ClasesScreen() {
  const { color } = useTema();
  const { datos: clases, recargar, cargando } = useRecurso(obtenerClases, [] as Clase[]);
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [guardando, setGuardando] = useState(false);

  const nueva = () => setEdicion({ clase: null, nombre: '', precio: '', activa: true });

  async function guardar() {
    if (!edicion) return;
    const precio = parseFloat(edicion.precio) || 0;
    setGuardando(true);
    try {
      if (edicion.clase) await editarClase(edicion.clase.id, { nombre: edicion.clase.nombre, precio, activa: edicion.activa });
      else await crearClase({ nombre: edicion.nombre.trim(), precio });
      setEdicion(null);
      recargar();
    } catch (e) {
      Alert.alert('No se pudo guardar la clase', (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  function borrar(clase: Clase) {
    confirmar(
      `¿Eliminar ${clase.nombre}?`,
      'Quienes ya la tienen la conservan en su ficha. Si solo quieres dejar de ofrecerla, desactívala.',
      'Eliminar',
      async () => {
        await eliminarClase(clase.id);
        setEdicion(null);
        recargar();
      },
    );
  }

  return (
    <PantallaSecundaria
      titulo="Clases y precios"
      descripcion="El precio es mensual y se usa cuando cobras por clase."
      acciones={<BotonIcono destacado etiqueta="Agregar clase" icono={<Plus size={22} color={color.sobreMarca} />} onPress={nueva} />}
    >
      {clases.length === 0 && !cargando ? (
        <EstadoVacio icono={BookOpen} titulo="Aún no hay clases" mensaje="Agrega las clases que ofreces para poder inscribir." accion={{ titulo: 'Agregar clase', onPress: nueva }} />
      ) : (
        <Grupo>
          {clases.map((c) => (
            <Fila
              key={c.id}
              titulo={c.nombre}
              detalle={`${formatoMoneda(c.precio)} al mes`}
              derecha={c.activa ? undefined : <Insignia texto="Inactiva" />}
              onPress={() => setEdicion({ clase: c, nombre: c.nombre, precio: String(c.precio), activa: c.activa })}
            />
          ))}
        </Grupo>
      )}

      <Hoja
        visible={!!edicion}
        titulo={edicion?.clase ? edicion.clase.nombre : 'Nueva clase'}
        onCerrar={() => setEdicion(null)}
        accion={{ titulo: 'Guardar', onPress: guardar, cargando: guardando }}
      >
        {edicion && (
          <>
            {!edicion.clase && (
              <Campo
                etiqueta="Nombre"
                value={edicion.nombre}
                onChangeText={(v) => setEdicion({ ...edicion, nombre: v })}
                placeholder="Ej. Defensa personal"
                autoFocus
                maxLength={80}
              />
            )}
            <Campo
              etiqueta="Precio mensual"
              value={edicion.precio}
              onChangeText={(v) => setEdicion({ ...edicion, precio: v.replace(/[^0-9.]/g, '') })}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            {edicion.clase && (
              <>
                <Grupo>
                  <ParDato etiqueta="Se puede inscribir">
                    <Switch
                      value={edicion.activa}
                      onValueChange={(v) => setEdicion({ ...edicion, activa: v })}
                      trackColor={{ true: color.marca, false: color.bordeFuerte }}
                      thumbColor="#ffffff"
                      accessibilityLabel="Clase activa"
                    />
                  </ParDato>
                </Grupo>
                <View style={{ gap: 10 }}>
                  <Texto variante="pequeno" tono="tenue">
                    El nombre no se puede cambiar porque las fichas de tus alumnos lo usan. Para renombrar, crea otra clase y desactiva esta.
                  </Texto>
                  <Boton titulo="Eliminar clase" icono={IconoEliminar} variante="peligro" onPress={() => borrar(edicion.clase!)} />
                </View>
              </>
            )}
          </>
        )}
      </Hoja>
    </PantallaSecundaria>
  );
}
