import { Package, PackagePlus, SearchX, ShoppingCart, TriangleAlert, WifiOff } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
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
import { useEspacioBarra } from '@/components/BarraLiquida';
import { IconoEditar, IconoEliminar } from '@/components/iconos/Iconly';
import {
  Boton,
  BotonIcono,
  Buscador,
  Campo,
  confirmar,
  Encabezado,
  EstadoVacio,
  Fila,
  Grupo,
  Hoja,
  ItemGrupo,
  ParDato,
  Superficie,
  Texto,
} from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { useRecurso } from '@/hooks/useRecurso';
import { useTema } from '@/theme';
import { cantidad } from '@/utils/texto';

type DatosInventario = { productos: Producto[]; alertas: string[] };

const cargarInventario = async (): Promise<DatosInventario> => {
  const [productos, alertas] = await Promise.all([obtenerInventario(), obtenerAlertasInventario()]);
  return { productos, alertas };
};

// La hoja pasa por estos modos sin cerrarse: detalle → vender / editar
type Modo =
  | { tipo: 'detalle'; producto: Producto }
  | { tipo: 'vender'; producto: Producto; precio: string }
  | { tipo: 'editar'; producto: Producto; nombre: string; cantidad: string; minimo: string }
  | { tipo: 'nuevo'; nombre: string; cantidad: string; minimo: string };

const aEntero = (s: string) => {
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
};

export default function InventarioScreen() {
  const { color } = useTema();
  const { margen, maximo } = useDiseno();
  const espacioBarra = useEspacioBarra();
  const { datos, cargando, error, recargar } = useRecurso(cargarInventario, { productos: [], alertas: [] });
  const [busqueda, setBusqueda] = useState('');
  const [modo, setModo] = useState<Modo | null>(null);
  const [guardando, setGuardando] = useState(false);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? datos.productos.filter((p) => p.nombre.toLowerCase().includes(q)) : datos.productos;
  }, [datos.productos, busqueda]);

  const bajos = datos.productos.filter((p) => p.stockActual <= p.stockMinimo).length;

  function actualizar(campo: string, valor: string) {
    setModo((m) => (m ? ({ ...m, [campo]: valor } as Modo) : m));
  }

  async function guardar() {
    if (!modo || modo.tipo === 'detalle') return;
    setGuardando(true);
    try {
      if (modo.tipo === 'vender') {
        const precio = parseFloat(modo.precio);
        if (Number.isNaN(precio) || precio < 0) throw new Error('Escribe un precio válido.');
        await venderProducto(modo.producto.id, precio);
      } else {
        if (!modo.nombre.trim()) throw new Error('El producto necesita un nombre.');
        if (modo.tipo === 'nuevo') {
          await agregarProducto({ nombre: modo.nombre.trim(), cantidad: aEntero(modo.cantidad), stockMinimo: aEntero(modo.minimo) });
        } else {
          await editarProducto(modo.producto.id, {
            nombre: modo.nombre.trim(),
            nuevoStockActual: aEntero(modo.cantidad),
            nuevoStockMinimo: aEntero(modo.minimo),
            imagenUrl: modo.producto.imagenUrl,
          });
        }
      }
      setModo(null);
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
      setModo(null);
      recargar();
    });
  }

  const nuevo = () => setModo({ tipo: 'nuevo', nombre: '', cantidad: '10', minimo: '3' });

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

  const titulos: Record<Modo['tipo'], string> = {
    detalle: modo && 'producto' in modo ? modo.producto.nombre : '',
    vender: 'Registrar venta',
    editar: 'Editar producto',
    nuevo: 'Nuevo producto',
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.fondo }}>
      <FlatList
        data={filtrados}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[estilos.lista, { paddingHorizontal: margen, paddingBottom: espacioBarra, maxWidth: maximo + margen * 2 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} />}
        ListHeaderComponent={
          <View style={estilos.cabecera}>
            <Encabezado
              titulo="Inventario"
              detalle={bajos > 0 ? `${cantidad(bajos, 'producto', 'productos')} por resurtir` : undefined}
              acciones={
                <BotonIcono destacado etiqueta="Agregar producto" icono={<PackagePlus size={21} color={color.sobreMarca} />} onPress={nuevo} />
              }
            />
            {datos.alertas.length > 0 && (
              <View style={[estilos.alerta, { backgroundColor: color.avisoSuave }]}>
                <TriangleAlert size={18} color={color.aviso} />
                <Texto variante="detalle" style={{ flex: 1 }}>
                  {bajos > 0
                    ? `${cantidad(bajos, 'producto llegó', 'productos llegaron')} a su mínimo. Resúrtelos pronto.`
                    : 'Hay productos con aviso de resurtido.'}
                </Texto>
              </View>
            )}
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
                detalle={bajo ? `Por resurtir, mínimo ${item.stockMinimo}` : `Mínimo ${item.stockMinimo}`}
                izquierda={
                  <View style={[estilos.stock, { backgroundColor: bajo ? color.peligroSuave : color.fondo }]}>
                    <Texto variante="subtitulo" cifras style={{ color: bajo ? color.peligro : color.texto }}>
                      {item.stockActual}
                    </Texto>
                  </View>
                }
                onPress={() => setModo({ tipo: 'detalle', producto: item })}
              />
            </ItemGrupo>
          );
        }}
      />

      <Hoja
        visible={modo !== null}
        titulo={modo ? titulos[modo.tipo] : ''}
        descripcion={modo?.tipo === 'vender' ? `${modo.producto.nombre}. Se descuenta una pieza y la venta se suma a las finanzas del mes.` : undefined}
        onCerrar={() => setModo(null)}
        accion={
          modo && modo.tipo !== 'detalle'
            ? { titulo: modo.tipo === 'vender' ? 'Registrar venta' : 'Guardar', onPress: guardar, cargando: guardando }
            : undefined
        }
      >
        {modo?.tipo === 'detalle' && (
          <>
            <Superficie style={{ alignItems: 'center', gap: 4, paddingVertical: 20 }}>
              <Texto variante="detalle" tono="suave">
                En existencia
              </Texto>
              <Texto variante="cifra" cifras style={{ fontSize: 44, lineHeight: 50 }}>
                {modo.producto.stockActual}
              </Texto>
            </Superficie>
            <Grupo>
              <ParDato etiqueta="Avisar al llegar a" valor={String(modo.producto.stockMinimo)} />
            </Grupo>
            <Boton
              titulo="Vender una pieza"
              icono={ShoppingCart}
              deshabilitado={modo.producto.stockActual === 0}
              onPress={() => setModo({ tipo: 'vender', producto: modo.producto, precio: '' })}
            />
            <View style={estilos.acciones}>
              <Boton
                titulo="Editar"
                icono={IconoEditar}
                variante="contorno"
                style={{ flex: 1 }}
                onPress={() =>
                  setModo({
                    tipo: 'editar',
                    producto: modo.producto,
                    nombre: modo.producto.nombre,
                    cantidad: String(modo.producto.stockActual),
                    minimo: String(modo.producto.stockMinimo),
                  })
                }
              />
              <Boton titulo="Eliminar" icono={IconoEliminar} variante="peligro" style={{ flex: 1 }} onPress={() => eliminar(modo.producto)} />
            </View>
          </>
        )}

        {modo?.tipo === 'vender' && (
          <Campo
            etiqueta="Precio de venta"
            value={modo.precio}
            onChangeText={(v) => actualizar('precio', v)}
            keyboardType="decimal-pad"
            placeholder="0.00"
            autoFocus
          />
        )}

        {(modo?.tipo === 'editar' || modo?.tipo === 'nuevo') && (
          <>
            <Campo etiqueta="Nombre" value={modo.nombre} onChangeText={(v) => actualizar('nombre', v)} placeholder="Ej. Guantes de 14 oz" />
            <View style={estilos.acciones}>
              <View style={{ flex: 1 }}>
                <Campo
                  etiqueta={modo.tipo === 'nuevo' ? 'Piezas' : 'En existencia'}
                  value={modo.cantidad}
                  onChangeText={(v) => actualizar('cantidad', v)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Campo etiqueta="Avisar al llegar a" value={modo.minimo} onChangeText={(v) => actualizar('minimo', v)} keyboardType="number-pad" />
              </View>
            </View>
          </>
        )}
      </Hoja>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  lista: { width: '100%', alignSelf: 'center' },
  cabecera: { gap: 14, marginBottom: 16 },
  alerta: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14 },
  stock: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  acciones: { flexDirection: 'row', gap: 10 },
});
