import { Package, PackagePlus, SearchX, ShoppingCart, TriangleAlert, WifiOff } from 'lucide-react-native';
import { IconoEditar, IconoEliminar } from '@/components/iconos/Iconly';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  agregarProducto,
  editarProducto,
  eliminarProducto,
  obtenerAlertasInventario,
  obtenerInventario,
  venderProducto,
  type Producto,
} from '@/api/endpoints';
import {
  Boton,
  BotonIcono,
  Buscador,
  Campo,
  confirmar,
  Encabezado,
  EstadoVacio,
  Fila,
  Hoja,
  Insignia,
  ItemGrupo,
  Texto,
} from '@/components/ui';
import { useRecurso } from '@/hooks/useRecurso';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { useTema } from '@/theme';
import { cantidad } from '@/utils/texto';

type DatosInventario = { productos: Producto[]; alertas: string[] };

const cargarInventario = async (): Promise<DatosInventario> => {
  const [productos, alertas] = await Promise.all([obtenerInventario(), obtenerAlertasInventario()]);
  return { productos, alertas };
};

// Una sola hoja para alta, edición y venta
type Formulario =
  | { tipo: 'nuevo'; nombre: string; cantidad: string; minimo: string }
  | { tipo: 'editar'; producto: Producto; nombre: string; cantidad: string; minimo: string }
  | { tipo: 'vender'; producto: Producto; precio: string };

const aEntero = (s: string) => {
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
};

export default function InventarioScreen() {
  const espacioBarra = useEspacioBarra();
  const { color, espacio } = useTema();
  const { datos, cargando, error, recargar } = useRecurso(cargarInventario, { productos: [], alertas: [] });
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState<Formulario | null>(null);
  const [guardando, setGuardando] = useState(false);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? datos.productos.filter((p) => p.nombre.toLowerCase().includes(q)) : datos.productos;
  }, [datos.productos, busqueda]);

  const bajos = datos.productos.filter((p) => p.stockActual <= p.stockMinimo).length;

  function actualizar(campo: string, valor: string) {
    setForm((f) => (f ? ({ ...f, [campo]: valor } as Formulario) : f));
  }

  async function guardar() {
    if (!form) return;
    setGuardando(true);
    try {
      if (form.tipo === 'vender') {
        const precio = parseFloat(form.precio);
        if (Number.isNaN(precio) || precio < 0) throw new Error('Escribe un precio válido.');
        await venderProducto(form.producto.id, precio);
      } else {
        if (!form.nombre.trim()) throw new Error('El producto necesita un nombre.');
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
      Alert.alert('No se pudo guardar', (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  function eliminar(p: Producto) {
    confirmar(`¿Eliminar ${p.nombre}?`, 'Se quitará del inventario.', 'Eliminar', async () => {
      await eliminarProducto(p.id);
      recargar();
    });
  }

  const nuevo = () => setForm({ tipo: 'nuevo', nombre: '', cantidad: '10', minimo: '3' });

  const vacio = error ? (
    <EstadoVacio icono={WifiOff} tono="error" titulo="No se pudo cargar el inventario" mensaje={error} accion={{ titulo: 'Reintentar', onPress: recargar }} />
  ) : cargando ? null : busqueda ? (
    <EstadoVacio icono={SearchX} titulo="Sin resultados" mensaje={`Ningún producto coincide con "${busqueda}".`} />
  ) : (
    <EstadoVacio
      icono={Package}
      titulo="Tu inventario está vacío"
      mensaje="Agrega lo que vendes en recepción: uniformes, equipo, bebidas."
      accion={{ titulo: 'Agregar producto', onPress: nuevo }}
    />
  );

  const tituloHoja =
    form?.tipo === 'vender' ? `Vender ${form.producto.nombre}` : form?.tipo === 'editar' ? 'Editar producto' : 'Nuevo producto';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.fondo }}>
      <FlatList
        data={filtrados}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: espacio.l, paddingBottom: espacioBarra }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} />}
        ListHeaderComponent={
          <View style={estilos.cabecera}>
            <Encabezado
              titulo="Inventario"
              detalle={bajos > 0 ? `${cantidad(bajos, 'producto', 'productos')} por resurtir` : undefined}
              acciones={
                <BotonIcono
                  destacado
                  etiqueta="Agregar producto"
                  icono={<PackagePlus size={21} color={color.sobreMarca} />}
                  onPress={nuevo}
                />
              }
            />
            {datos.alertas.map((a) => (
              <View key={a} style={[estilos.alerta, { backgroundColor: color.avisoSuave }]}>
                <TriangleAlert size={18} color={color.aviso} />
                <Texto variante="detalle" style={{ flex: 1, color: color.texto }}>
                  {a.replace(/^⚠️\s*ALERTA:\s*/, '')}
                </Texto>
              </View>
            ))}
            {datos.productos.length > 0 && <Buscador value={busqueda} onChangeText={setBusqueda} placeholder="Buscar producto" />}
          </View>
        }
        ListEmptyComponent={vacio}
        renderItem={({ item, index }) => {
          const bajo = item.stockActual <= item.stockMinimo;
          return (
            <ItemGrupo indice={index} total={filtrados.length}>
              <Fila
                titulo={item.nombre}
                detalle={`Mínimo ${item.stockMinimo}`}
                izquierda={
                  <View style={[estilos.stock, { backgroundColor: bajo ? color.peligroSuave : color.exitoSuave }]}>
                    <Texto variante="subtitulo" cifras style={{ color: bajo ? color.peligro : color.exito }}>
                      {item.stockActual}
                    </Texto>
                  </View>
                }
                derecha={
                  <View style={estilos.iconos}>
                    <Pressable
                      hitSlop={10}
                      accessibilityLabel={`Editar ${item.nombre}`}
                      onPress={() =>
                        setForm({ tipo: 'editar', producto: item, nombre: item.nombre, cantidad: String(item.stockActual), minimo: String(item.stockMinimo) })
                      }
                    >
                      <IconoEditar size={21} color={color.textoTenue} />
                    </Pressable>
                    <Pressable hitSlop={10} accessibilityLabel={`Eliminar ${item.nombre}`} onPress={() => eliminar(item)}>
                      <IconoEliminar size={21} color={color.textoTenue} />
                    </Pressable>
                  </View>
                }
              >
                <View style={estilos.pie}>
                  {bajo ? <Insignia texto="Por resurtir" tono="peligro" /> : <View />}
                  <Boton
                    titulo="Vender"
                    icono={ShoppingCart}
                    tamano="compacto"
                    variante="contorno"
                    deshabilitado={item.stockActual === 0}
                    onPress={() => setForm({ tipo: 'vender', producto: item, precio: '' })}
                  />
                </View>
              </Fila>
            </ItemGrupo>
          );
        }}
      />

      <Hoja
        visible={form !== null}
        titulo={tituloHoja}
        descripcion={form?.tipo === 'vender' ? 'Se descuenta una pieza y la venta se suma a las finanzas del mes.' : undefined}
        onCerrar={() => setForm(null)}
        accion={{ titulo: form?.tipo === 'vender' ? 'Registrar venta' : 'Guardar', onPress: guardar, cargando: guardando }}
      >
        {form?.tipo === 'vender' ? (
          <Campo
            etiqueta="Precio de venta"
            value={form.precio}
            onChangeText={(v) => actualizar('precio', v)}
            keyboardType="decimal-pad"
            placeholder="0.00"
            autoFocus
          />
        ) : form ? (
          <>
            <Campo etiqueta="Nombre" value={form.nombre} onChangeText={(v) => actualizar('nombre', v)} placeholder="Ej. Guantes de 14 oz" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Campo
                  etiqueta={form.tipo === 'nuevo' ? 'Piezas' : 'En existencia'}
                  value={form.cantidad}
                  onChangeText={(v) => actualizar('cantidad', v)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Campo
                  etiqueta="Avisar al llegar a"
                  value={form.minimo}
                  onChangeText={(v) => actualizar('minimo', v)}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </>
        ) : null}
      </Hoja>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  cabecera: { gap: 14, marginBottom: 16 },
  alerta: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12 },
  stock: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconos: { flexDirection: 'row', gap: 18, alignSelf: 'flex-start', paddingTop: 2 },
  pie: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
});
