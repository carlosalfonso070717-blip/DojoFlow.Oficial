import { Copy, ExternalLink, Package, PackagePlus, SearchX, ShoppingCart, TriangleAlert, WifiOff } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  agregarProducto,
  editarProducto,
  eliminarProducto,
  obtenerAlertasInventario,
  obtenerEnlaceCatalogo,
  obtenerInventario,
  quitarImagenProducto,
  renovarEnlaceCatalogo,
  subirImagenProducto,
  venderProducto,
  type Producto,
} from '@/api/endpoints';
import { useEspacioBarra } from '@/components/BarraLiquida';
import { FotoProducto, SelectorFoto } from '@/components/Foto';
import { IconoCompartir, IconoEditar, IconoEliminar } from '@/components/iconos/Iconly';
import {
  Boton,
  BotonIcono,
  Buscador,
  Campo,
  CeldaLista,
  confirmar,
  Encabezado,
  EstadoVacio,
  Fila,
  Grupo,
  Hoja,
  formatoMoneda,
  ParDato,
  Presionable,
  Superficie,
  Texto,
  useRejilla,
} from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { useRecurso } from '@/hooks/useRecurso';
import { useSesion } from '@/auth/session';
import { useTema } from '@/theme';
import { useObjetivoTour } from '@/tour/Tour';
import { cantidad } from '@/utils/texto';
import { alerta } from '@/utils/alerta';
import { abrirEnlace, compartirEnlace, copiarEnlace, puedeCompartir } from '@/utils/compartir';
import type { ArchivoLogo } from '@/utils/logo';

type DatosInventario = { productos: Producto[]; alertas: string[] };

const cargarInventario = async (): Promise<DatosInventario> => {
  const [productos, alertas] = await Promise.all([obtenerInventario(), obtenerAlertasInventario()]);
  return { productos, alertas };
};

// Campos de alta y edición; la foto nueva se sube después de guardar el producto
type Formulario = {
  nombre: string;
  cantidad: string;
  minimo: string;
  precio: string;
  enCatalogo: boolean;
  foto: ArchivoLogo | null;
  quitarFoto: boolean;
};

// La hoja pasa por estos modos sin cerrarse: detalle → vender / editar
type Modo =
  | { tipo: 'detalle'; producto: Producto }
  | { tipo: 'vender'; producto: Producto; precio: string }
  | ({ tipo: 'editar'; producto: Producto } & Formulario)
  | ({ tipo: 'nuevo' } & Formulario)
  | { tipo: 'compartir'; url: string | null };

const aEntero = (s: string) => {
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
};

export default function InventarioScreen() {
  const refTour = useObjetivoTour('inventario');
  const { color } = useTema();
  const { margen, anchoSeccion, arriba } = useDiseno();
  const rejilla = useRejilla();
  const espacioBarra = useEspacioBarra();
  const { datos, cargando, error, recargar } = useRecurso(cargarInventario, { productos: [], alertas: [] });
  const [busqueda, setBusqueda] = useState('');
  const [modo, setModo] = useState<Modo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const { perfil } = useSesion();

  // Pide (o crea) el enlace del catálogo y abre la hoja para compartirlo
  async function abrirCompartir() {
    setModo({ tipo: 'compartir', url: null });
    try {
      const { url } = await obtenerEnlaceCatalogo();
      setModo({ tipo: 'compartir', url });
    } catch (e) {
      setModo(null);
      alerta('No se pudo obtener el enlace', (e as Error).message);
    }
  }

  async function compartir(url: string) {
    const nombre = perfil?.academia.nombre ?? 'la academia';
    try {
      await compartirEnlace(`Mira el catálogo de ${nombre}:`, url);
    } catch (e) {
      alerta('No se pudo compartir', (e as Error).message);
    }
  }

  function renovar() {
    confirmar(
      '¿Cambiar el enlace?',
      'El enlace anterior dejará de funcionar; tendrás que compartir el nuevo.',
      'Cambiar enlace',
      async () => {
        const { url } = await renovarEnlaceCatalogo();
        setModo({ tipo: 'compartir', url });
      },
    );
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? datos.productos.filter((p) => p.nombre.toLowerCase().includes(q)) : datos.productos;
  }, [datos.productos, busqueda]);

  const bajos = datos.productos.filter((p) => p.stockActual <= p.stockMinimo).length;

  function actualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setModo((m) => (m && (m.tipo === 'editar' || m.tipo === 'nuevo') ? { ...m, [campo]: valor } : m));
  }

  function actualizarPrecioVenta(precio: string) {
    setModo((m) => (m?.tipo === 'vender' ? { ...m, precio } : m));
  }

  async function guardar() {
    if (!modo || modo.tipo === 'detalle' || modo.tipo === 'compartir') return;
    setGuardando(true);
    try {
      if (modo.tipo === 'vender') {
        const precio = parseFloat(modo.precio);
        if (Number.isNaN(precio) || precio < 0) throw new Error('Escribe un precio válido.');
        await venderProducto(modo.producto.id, precio);
      } else {
        if (!modo.nombre.trim()) throw new Error('El producto necesita un nombre.');
        let id: string;
        if (modo.tipo === 'nuevo') {
          const creado = await agregarProducto({
            nombre: modo.nombre.trim(),
            cantidad: aEntero(modo.cantidad),
            stockMinimo: aEntero(modo.minimo),
            precio: parseFloat(modo.precio) || 0,
            enCatalogo: modo.enCatalogo,
          });
          id = creado.id;
        } else {
          id = modo.producto.id;
          await editarProducto(id, {
            nombre: modo.nombre.trim(),
            nuevoStockActual: aEntero(modo.cantidad),
            nuevoStockMinimo: aEntero(modo.minimo),
            imagenUrl: modo.producto.imagenUrl,
            precio: parseFloat(modo.precio) || 0,
            enCatalogo: modo.enCatalogo,
          });
        }
        // El producto ya quedó guardado; si la foto falla se avisa aparte
        try {
          if (modo.foto) await subirImagenProducto(id, modo.foto);
          else if (modo.quitarFoto && modo.tipo === 'editar' && modo.producto.imagenUrl) await quitarImagenProducto(id);
        } catch (e) {
          alerta('El producto se guardó, pero la foto no', (e as Error).message);
        }
      }
      setModo(null);
      recargar();
    } catch (e) {
      alerta('No se pudo guardar', (e as Error).message);
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

  const nuevo = () =>
    setModo({ tipo: 'nuevo', nombre: '', cantidad: '10', minimo: '3', precio: '', enCatalogo: true, foto: null, quitarFoto: false });

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
    compartir: 'Compartir catálogo',
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.fondo }}>
      <FlatList
        key={rejilla.clave}
        {...rejilla.props}
        data={filtrados}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[estilos.lista, { paddingHorizontal: margen, paddingTop: arriba, paddingBottom: espacioBarra, maxWidth: anchoSeccion + margen * 2 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.marcaTexto} />}
        ListHeaderComponent={
          <View style={estilos.cabecera} ref={refTour} collapsable={false}>
            <Encabezado
              titulo="Inventario"
              detalle={bajos > 0 ? `${cantidad(bajos, 'producto', 'productos')} por resurtir` : undefined}
              acciones={
                <>
                  <BotonIcono etiqueta="Compartir catálogo" icono={<IconoCompartir size={21} color={color.texto} />} onPress={abrirCompartir} />
                  <BotonIcono destacado etiqueta="Agregar producto" icono={<PackagePlus size={21} color={color.sobreMarca} />} onPress={nuevo} />
                </>
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
          const abrir = () => setModo({ tipo: 'detalle', producto: item });
          // Escritorio: tarjeta con la foto grande
          if (rejilla.columnas > 1) return <TarjetaProducto producto={item} columnas={rejilla.columnas} onPress={abrir} />;

          const bajo = item.stockActual <= item.stockMinimo;
          const stock = (
            <View style={[estilos.stock, { backgroundColor: bajo ? color.peligroSuave : color.fondo }]}>
              <Texto variante="subtitulo" cifras style={{ color: bajo ? color.peligro : color.texto }}>
                {item.stockActual}
              </Texto>
            </View>
          );
          return (
            <CeldaLista indice={index} total={filtrados.length} columnas={1}>
              <Fila
                titulo={item.nombre}
                detalle={bajo ? `Por resurtir, mínimo ${item.stockMinimo}` : item.precio > 0 ? formatoMoneda(item.precio) : `Mínimo ${item.stockMinimo}`}
                // Con foto, la existencia pasa a la derecha
                izquierda={item.imagenUrl ? <FotoProducto url={item.imagenUrl} tamano={44} /> : stock}
                derecha={item.imagenUrl ? stock : undefined}
                onPress={abrir}
              />
            </CeldaLista>
          );
        }}
      />

      <Hoja
        visible={modo !== null}
        titulo={modo ? titulos[modo.tipo] : ''}
        descripcion={
          modo?.tipo === 'vender'
            ? `${modo.producto.nombre}. Se descuenta una pieza y la venta se suma a las finanzas del mes.`
            : modo?.tipo === 'compartir'
              ? 'Tus alumnos ven los productos, su precio y si hay existencias, sin necesidad de cuenta.'
              : undefined
        }
        onCerrar={() => setModo(null)}
        accion={
          modo && modo.tipo !== 'detalle' && modo.tipo !== 'compartir'
            ? { titulo: modo.tipo === 'vender' ? 'Registrar venta' : 'Guardar', onPress: guardar, cargando: guardando }
            : undefined
        }
      >
        {modo?.tipo === 'detalle' && (
          <>
            {!!modo.producto.imagenUrl && <FotoProducto url={modo.producto.imagenUrl} style={estilos.fotoGrande} />}
            <Superficie style={{ alignItems: 'center', gap: 4, paddingVertical: 20 }}>
              <Texto variante="detalle" tono="suave">
                En existencia
              </Texto>
              <Texto variante="cifra" cifras style={{ fontSize: 44, lineHeight: 50 }}>
                {modo.producto.stockActual}
              </Texto>
            </Superficie>
            <Grupo>
              <ParDato etiqueta="Precio" valor={modo.producto.precio > 0 ? formatoMoneda(modo.producto.precio) : 'Sin precio'} />
              <ParDato etiqueta="Avisar al llegar a" valor={String(modo.producto.stockMinimo)} />
              <ParDato etiqueta="En el catálogo" valor={modo.producto.enCatalogo ? 'Visible' : 'Oculto'} />
            </Grupo>
            <Boton
              titulo="Vender una pieza"
              icono={ShoppingCart}
              deshabilitado={modo.producto.stockActual === 0}
              onPress={() =>
                setModo({ tipo: 'vender', producto: modo.producto, precio: modo.producto.precio > 0 ? String(modo.producto.precio) : '' })
              }
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
                    precio: modo.producto.precio > 0 ? String(modo.producto.precio) : '',
                    enCatalogo: modo.producto.enCatalogo,
                    foto: null,
                    quitarFoto: false,
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
            onChangeText={actualizarPrecioVenta}
            keyboardType="decimal-pad"
            placeholder="0.00"
            autoFocus
          />
        )}

        {(modo?.tipo === 'editar' || modo?.tipo === 'nuevo') && (
          <>
            <SelectorFoto
              actual={modo.tipo === 'editar' ? modo.producto.imagenUrl : null}
              nueva={modo.foto}
              quitada={modo.quitarFoto}
              onElegir={(archivo) => {
                actualizar('foto', archivo);
                actualizar('quitarFoto', false);
              }}
              onQuitar={() => {
                actualizar('foto', null);
                actualizar('quitarFoto', true);
              }}
            />
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
            <Campo
              etiqueta="Precio de venta"
              value={modo.precio}
              onChangeText={(v) => actualizar('precio', v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              ayuda="Se propone al vender y aparece en el catálogo."
            />
            <Grupo>
              <ParDato etiqueta="Mostrar en el catálogo">
                <Switch
                  value={modo.enCatalogo}
                  onValueChange={(v) => actualizar('enCatalogo', v)}
                  trackColor={{ true: color.marca, false: color.bordeFuerte }}
                  thumbColor="#ffffff"
                  // react-native-web pinta el círculo encendido de verde azulado si no se indica
                  {...({ activeThumbColor: '#ffffff' } as object)}
                  accessibilityLabel="Mostrar en el catálogo"
                />
              </ParDato>
            </Grupo>
          </>
        )}

        {modo?.tipo === 'compartir' && (
          <>
            <Superficie style={{ gap: 6 }}>
              <Texto variante="pequeno" tono="tenue">
                Enlace del catálogo
              </Texto>
              <Texto variante="cuerpoFuerte" selectable numberOfLines={2}>
                {modo.url ?? 'Generando enlace...'}
              </Texto>
            </Superficie>
            {/* Celular: menú de compartir. Computadora: copiar, porque ahí el menú del sistema no sirve */}
            {puedeCompartir() ? (
              <Boton titulo="Compartir enlace" icono={IconoCompartir} deshabilitado={!modo.url} onPress={() => modo.url && compartir(modo.url)} />
            ) : (
              <Boton titulo="Copiar enlace" icono={Copy} deshabilitado={!modo.url} onPress={() => modo.url && copiarEnlace(modo.url)} />
            )}
            <Boton titulo="Ver catálogo" icono={ExternalLink} variante="contorno" deshabilitado={!modo.url} onPress={() => modo.url && abrirEnlace(modo.url)} />
            {perfil?.usuario.rol === 'Dueno' && (
              <Boton titulo="Cambiar enlace" variante="fantasma" tamano="compacto" deshabilitado={!modo.url} onPress={renovar} />
            )}
          </>
        )}
      </Hoja>
    </SafeAreaView>
  );
}

// Tarjeta de producto para la rejilla de escritorio
function TarjetaProducto({ producto, columnas, onPress }: { producto: Producto; columnas: number; onPress: () => void }) {
  const { color, radio } = useTema();
  const bajo = producto.stockActual <= producto.stockMinimo;
  return (
    <CeldaLista indice={0} total={1} columnas={columnas}>
      <Presionable onPress={onPress} escala={0.985} accessibilityRole="button" accessibilityLabel={producto.nombre} style={estilos.tarjeta}>
        <FotoProducto url={producto.imagenUrl} style={[estilos.fotoGrande, { borderRadius: radio.m }]} />
        <View style={estilos.pieTarjeta}>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="cuerpoFuerte" numberOfLines={1}>
              {producto.nombre}
            </Texto>
            <Texto variante="detalle" tono="suave" numberOfLines={1}>
              {producto.precio > 0 ? formatoMoneda(producto.precio) : 'Sin precio'}
              {producto.enCatalogo ? '' : ' · Oculto en el catálogo'}
            </Texto>
          </View>
          <View style={[estilos.pastilla, { backgroundColor: bajo ? color.peligroSuave : color.fondo }]}>
            <Texto variante="pequeno" cifras style={{ color: bajo ? color.peligro : color.textoSuave, fontFamily: 'Figtree_700Bold' }}>
              {bajo ? `Quedan ${producto.stockActual}` : `${producto.stockActual} en existencia`}
            </Texto>
          </View>
        </View>
      </Presionable>
    </CeldaLista>
  );
}

const estilos = StyleSheet.create({
  lista: { width: '100%', alignSelf: 'center' },
  cabecera: { gap: 14, marginBottom: 16 },
  alerta: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14 },
  stock: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  acciones: { flexDirection: 'row', gap: 10 },
  tarjeta: { padding: 12, gap: 12 },
  fotoGrande: { width: '100%', aspectRatio: 16 / 10 },
  pieTarjeta: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, paddingBottom: 2 },
  pastilla: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
});
