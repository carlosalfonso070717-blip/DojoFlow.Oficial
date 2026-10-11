import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  agregarProducto,
  editarProducto,
  eliminarProducto,
  obtenerAlertasInventario,
  obtenerInventario,
  venderProducto,
  type Producto,
} from '@/api/endpoints';
import { Badge, Boton, Buscador, Campo, confirmar, ModalFormulario, Tarjeta, TextoVacio } from '@/components/ui';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';

type DatosInventario = { productos: Producto[]; alertas: string[] };

const cargarInventario = async (): Promise<DatosInventario> => {
  const [productos, alertas] = await Promise.all([obtenerInventario(), obtenerAlertasInventario()]);
  return { productos, alertas };
};

// Un solo modal sirve para alta, edición y venta
type Formulario =
  | { tipo: 'nuevo'; nombre: string; cantidad: string; minimo: string }
  | { tipo: 'editar'; producto: Producto; nombre: string; cantidad: string; minimo: string }
  | { tipo: 'vender'; producto: Producto; precio: string };

const aEntero = (s: string) => {
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
};

export default function InventarioScreen() {
  const tema = useTema();
  const { datos, cargando, error, recargar } = useRecurso(cargarInventario, { productos: [], alertas: [] });
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState<Formulario | null>(null);
  const [guardando, setGuardando] = useState(false);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? datos.productos.filter((p) => p.nombre.toLowerCase().includes(q)) : datos.productos;
  }, [datos.productos, busqueda]);

  const actualizar = useCallback((campo: string, valor: string) => {
    setForm((f) => (f ? ({ ...f, [campo]: valor } as Formulario) : f));
  }, []);

  async function guardar() {
    if (!form) return;
    setGuardando(true);
    try {
      if (form.tipo === 'vender') {
        const precio = parseFloat(form.precio);
        if (Number.isNaN(precio) || precio < 0) throw new Error('El precio no puede ser negativo');
        await venderProducto(form.producto.id, precio);
        Alert.alert('Listo', 'Venta registrada en Finanzas');
      } else {
        if (!form.nombre.trim()) throw new Error('El nombre no puede estar vacío');
        if (form.tipo === 'nuevo') {
          await agregarProducto({ nombre: form.nombre.trim(), cantidad: aEntero(form.cantidad), stockMinimo: aEntero(form.minimo) });
        } else {
          await editarProducto(form.producto.id, {
            nombre: form.nombre.trim(),
            nuevoStockActual: aEntero(form.cantidad),
            nuevoStockMinimo: aEntero(form.minimo),
            imagenUrl: form.producto.imagenUrl,
          });
        }
      }
      setForm(null);
      recargar();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  function eliminar(p: Producto) {
    confirmar('¿Eliminar producto?', p.nombre, 'Eliminar', async () => {
      await eliminarProducto(p.id);
      recargar();
    });
  }

  return (
    <>
      <FlatList
        data={filtrados}
        keyExtractor={(p) => p.id}
        contentContainerStyle={estilos.lista}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={tema.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 10 }}>
            {datos.alertas.map((a) => (
              <View key={a} style={[estilos.alerta, { backgroundColor: tema.primary }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>⚠ {a}</Text>
              </View>
            ))}
            <Boton
              titulo="＋ Nuevo artículo"
              onPress={() => setForm({ tipo: 'nuevo', nombre: '', cantidad: '10', minimo: '3' })}
            />
            <Buscador value={busqueda} onChangeText={setBusqueda} placeholder="Buscar artículo..." />
          </View>
        }
        ListEmptyComponent={<TextoVacio error={error} cargando={cargando} texto="El inventario está vacío." />}
        renderItem={({ item }) => {
          const bajo = item.stockActual <= item.stockMinimo;
          return (
            <Tarjeta style={{ gap: 12 }}>
              <View style={estilos.fila}>
                <Text style={[estilos.nombre, { color: tema.text, flex: 1 }]}>📦 {item.nombre}</Text>
                <Badge texto={bajo ? 'Crítico' : 'Disponible'} color={bajo ? tema.primary : tema.success} />
              </View>

              <View style={estilos.fila}>
                <Text style={{ color: tema.textMuted, flex: 1 }}>
                  Stock{' '}
                  <Text style={{ fontSize: 22, fontWeight: '800', color: bajo ? tema.primary : tema.success }}>
                    {item.stockActual}
                  </Text>
                  {'  '}· mínimo {item.stockMinimo}
                </Text>
                <Pressable
                  hitSlop={10}
                  onPress={() =>
                    setForm({
                      tipo: 'editar',
                      producto: item,
                      nombre: item.nombre,
                      cantidad: String(item.stockActual),
                      minimo: String(item.stockMinimo),
                    })
                  }
                >
                  <Text style={{ fontSize: 18 }}>✏️</Text>
                </Pressable>
                <Pressable hitSlop={10} onPress={() => eliminar(item)}>
                  <Text style={{ fontSize: 18, color: tema.primary }}>🗑</Text>
                </Pressable>
              </View>

              <Boton
                titulo="🛒 Vender"
                variante="secundario"
                deshabilitado={item.stockActual === 0}
                onPress={() => setForm({ tipo: 'vender', producto: item, precio: '150' })}
              />
            </Tarjeta>
          );
        }}
      />

      <ModalFormulario
        visible={form !== null}
        titulo={
          form?.tipo === 'vender' ? `Vender: ${form.producto.nombre}` : form?.tipo === 'editar' ? 'Editar artículo' : 'Nuevo artículo'
        }
        textoConfirmar={form?.tipo === 'vender' ? 'Registrar salida' : 'Guardar'}
        onConfirmar={guardar}
        onCerrar={() => setForm(null)}
        cargando={guardando}
      >
        {form?.tipo === 'vender' ? (
          <Campo
            etiqueta="Precio de venta (MXN)"
            value={form.precio}
            onChangeText={(v) => actualizar('precio', v)}
            keyboardType="decimal-pad"
            autoFocus
          />
        ) : form ? (
          <>
            <Campo etiqueta="Nombre" value={form.nombre} onChangeText={(v) => actualizar('nombre', v)} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Campo
                  etiqueta={form.tipo === 'nuevo' ? 'Cantidad' : 'Stock'}
                  value={form.cantidad}
                  onChangeText={(v) => actualizar('cantidad', v)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Campo
                  etiqueta="Mínimo"
                  value={form.minimo}
                  onChangeText={(v) => actualizar('minimo', v)}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </>
        ) : null}
      </ModalFormulario>
    </>
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 16, gap: 12 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nombre: { fontSize: 17, fontWeight: '700' },
  alerta: { borderRadius: 12, padding: 14 },
});
