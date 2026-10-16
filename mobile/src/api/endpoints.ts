import type { CredencialGoogle } from '@/auth/google';
import { aFormData, type ArchivoLogo } from '@/utils/logo';
import { api } from './client';

// ===== AUTH =====
export type LoginRespuesta = { token: string; mensaje: string };

type Mensaje = { mensaje: string };

const post = <T>(ruta: string, body?: unknown) =>
  api<T>(ruta, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const login = (email: string, password: string) =>
  post<LoginRespuesta>('/Auth/login', { email, password });

// "Continuar con Google": si ya tiene cuenta trae la sesión; si no, sus datos para registrarse
export type RespuestaGoogle =
  | { registrado: true; token: string; mensaje: string }
  | { registrado: false; email: string; nombre: string };

export const continuarConGoogle = (credencial: CredencialGoogle) => post<RespuestaGoogle>('/Auth/google', credencial);

export const enviarVerificacion = (email: string) =>
  post<Mensaje>('/Auth/enviar-verificacion', { email });

export const confirmarVerificacion = (email: string, pin: string) =>
  post<Mensaje>('/Auth/confirmar-verificacion', { email, pin });

// Crea la academia y a su dueño; devuelve la sesión ya iniciada.
// Lo opcional que no se mande se toma de la plantilla del tipo de negocio.
// Con la credencial de Google la cuenta se crea sin correo ni contraseña.
export const registrarAcademia = (datos: {
  nombre: string;
  email?: string;
  password?: string;
  googleIdToken?: string;
  googleAccessToken?: string;
  nombreAcademia: string;
  tipoNegocio: string;
  colorPrimario?: string;
  colorSecundario?: string;
  terminoAlumno?: string;
  clases?: { nombre: string; precio: number }[];
  // Si tiene varias sucursales: el nombre de esta y los datos de las demás
  nombreSucursal?: string;
  sucursales?: DatosSucursal[];
}) => post<LoginRespuesta>('/Auth/signup', datos);

export const subirLogo = async (archivo: ArchivoLogo, tokenPropio?: string) =>
  api<MarcaAcademia>('/Academia/logo', { method: 'PUT', body: await aFormData(archivo), tokenPropio });

// ===== ACADEMIA =====
export type MarcaAcademia = {
  id: string;
  nombre: string;
  tipoNegocio: string;
  colorPrimario: string;
  colorSecundario: string;
  terminoAlumno: string;
  moneda: string;
  logoUrl: string | null;
  // Registrador de asistencias con PIN (opcional por academia)
  asistenciasActivas: boolean;
  // Varias sucursales (opcional por negocio); nombreSucursal es el de la sede de la sesión
  sucursalesActivas: boolean;
  nombreSucursal: string | null;
};

export type Perfil = {
  usuario: { id: string; nombre: string; email: string; rol: 'Dueno' | 'Coach'; tourCompletado: boolean; fotoUrl: string | null };
  academia: MarcaAcademia;
};

export type TipoNegocio = {
  tipoNegocio: string;
  terminoAlumno: string;
  colorPrimario: string;
  colorSecundario: string;
  clasesSugeridas: string[];
};

export const obtenerPerfil = () => api<Perfil>('/Auth/yo');

export const obtenerTiposNegocio = () => api<TipoNegocio[]>('/Academia/tipos', { tokenPropio: null });

// ===== CLASES =====
export type Clase = { id: string; nombre: string; precio: number; activa: boolean };

export const obtenerClases = () => api<Clase[]>('/Clases');

export const olvidePassword = (email: string) => post<Mensaje>('/Auth/olvide-password', { email });

export const resetearPassword = (email: string, pin: string, nuevaPassword: string) =>
  post<Mensaje>('/Auth/resetear-password', { email, pin, nuevaPassword });

// ===== ALUMNOS =====
export type Alumno = {
  id: string;
  nombre: string;
  telefono: string;
  disciplinas: string[];
  costoMensualidad: number;
  claveKiosco: number;
};

export type NuevoAlumno = {
  nombre: string;
  apellido: string;
  telefono: string;
  disciplinas: string[];
};

export type AlumnoRegistrado = {
  mensaje: string;
  idAsignado: string;
  nombreCompleto: string;
  claveKioscoAsignada: number;
  disciplinasInscritas: string[];
  costoMensualidadAsignado: string;
};

export const obtenerAlumnos = () => api<Alumno[]>('/Alumnos');

export const registrarAlumno = (alumno: NuevoAlumno) =>
  api<AlumnoRegistrado>('/Alumnos', { method: 'POST', body: JSON.stringify(alumno) });

export const eliminarAlumno = (id: string) => api<void>(`/Alumnos/${id}`, { method: 'DELETE' });

// ===== KIOSCO (usa su propio token, ligado a la academia) =====
export type ResultadoChequeo = {
  nombreCompleto: string;
  disciplinas: string[];
  estatusFinanciero: string;
  fechaHora: string;
  permitirAcceso: boolean;
};

export const crearSesionKiosco = () => post<{ token: string }>('/Asistencias/sesion-kiosco');

export const obtenerMarcaKiosco = (tokenKiosco: string) =>
  api<MarcaAcademia>('/Academia/marca', { tokenPropio: tokenKiosco });

export const checarAsistencia = (pin: string, tokenKiosco: string) =>
  api<ResultadoChequeo>(`/Asistencias/checar?pin=${encodeURIComponent(pin)}`, {
    method: 'POST',
    tokenPropio: tokenKiosco,
  });

// ===== MENSUALIDADES =====
export type EstadoMensualidad = 'Pagado' | 'Pendiente' | 'Vencido' | (string & {});

export type Mensualidad = {
  id: string;
  alumnoId: string;
  nombreAlumno: string;
  claveKiosco: string;
  monto: number;
  estado: EstadoMensualidad;
  fechaVencimiento: string;
  fechaPago: string;
};

export const obtenerMensualidades = () => api<Mensualidad[]>('/Mensualidades');

export const pagarMensualidad = (id: string) =>
  post<Mensaje & { nuevoEstado: string }>(`/Mensualidades/${id}/pagar`);

// ===== INVENTARIO =====
export type Producto = {
  id: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  imagenUrl: string;
  precio: number;
  enCatalogo: boolean;
};

export const obtenerInventario = () => api<Producto[]>('/Inventario');

export const obtenerAlertasInventario = () => api<string[]>('/Inventario/alertas');

export const agregarProducto = (datos: { nombre: string; cantidad: number; stockMinimo: number; precio: number; enCatalogo: boolean }) =>
  post<Producto>('/Inventario', datos);

// La API sobrescribe ImagenUrl en cada PUT, por eso siempre se manda la actual
export const editarProducto = (
  id: string,
  datos: { nombre: string; nuevoStockActual: number; nuevoStockMinimo: number; imagenUrl: string; precio: number; enCatalogo: boolean },
) => api<Mensaje>(`/Inventario/${id}`, { method: 'PUT', body: JSON.stringify(datos) });

export const eliminarProducto = (id: string) => api<Mensaje>(`/Inventario/${id}`, { method: 'DELETE' });

// La foto se guarda en la API y el producto queda con su URL en imagenUrl
export const subirImagenProducto = async (id: string, archivo: ArchivoLogo) =>
  api<Producto>(`/Inventario/${id}/imagen`, { method: 'PUT', body: await aFormData(archivo) });

export const quitarImagenProducto = (id: string) => api<Producto>(`/Inventario/${id}/imagen`, { method: 'DELETE' });

export const venderProducto = (id: string, precioVenta: number, cantidad = 1) =>
  post<Mensaje & { stockActual: number }>(
    `/Inventario/${id}/salida?cantidad=${cantidad}&precioVenta=${precioVenta}`,
  );

// ===== FINANZAS =====
export type RegistroFinanciero = {
  id: number;
  mesAnio: string;
  ingresosMensualidades: number;
  ingresosVentas: number;
  ventasRealizadas: number;
  total: number;
};

export const obtenerFinanzas = () => api<RegistroFinanciero[]>('/Finanzas');

export const eliminarMesFinanzas = (mesAnio: string) =>
  api<Mensaje>(`/Finanzas/${encodeURIComponent(mesAnio)}`, { method: 'DELETE' });

// ===== AJUSTES DE LA ACADEMIA (solo el dueño puede cambiarlos) =====
export type ModoCobro = 'Paquete' | 'PorClase';

export type ConfiguracionCobro = { modoCobro: ModoCobro; preciosPaquete: number[]; diaVencimiento: number };

export type ConfiguracionAcademia = { marca: MarcaAcademia; cobro: ConfiguracionCobro };

export const obtenerConfiguracion = () => api<ConfiguracionAcademia>('/Academia');

export const actualizarMarca = (datos: { nombre: string; colorPrimario: string; colorSecundario: string; terminoAlumno: string }) =>
  api<MarcaAcademia>('/Academia/marca', { method: 'PUT', body: JSON.stringify(datos) });

export const configurarCobro = (datos: ConfiguracionCobro) =>
  api<ConfiguracionCobro>('/Academia/cobro', { method: 'PUT', body: JSON.stringify(datos) });

export const quitarLogo = () => api<MarcaAcademia>('/Academia/logo', { method: 'DELETE' });

export const crearClase = (datos: { nombre: string; precio: number }) => post<Clase>('/Clases', { ...datos, activa: true });

export const editarClase = (id: string, datos: { nombre: string; precio: number; activa: boolean }) =>
  api<Clase>(`/Clases/${id}`, { method: 'PUT', body: JSON.stringify(datos) });

export const eliminarClase = (id: string) => api<Mensaje>(`/Clases/${id}`, { method: 'DELETE' });

// Foto de perfil de quien tiene la sesión
export const subirFotoPerfil = async (archivo: ArchivoLogo) =>
  api<{ fotoUrl: string | null }>('/Auth/foto', { method: 'PUT', body: await aFormData(archivo) });

export const quitarFotoPerfil = () => api<{ fotoUrl: string | null }>('/Auth/foto', { method: 'DELETE' });

export const marcarTourCompletado = () => post<Mensaje>('/Auth/tour-completado');

// ===== CATÁLOGO COMPARTIBLE =====
export const obtenerEnlaceCatalogo = () => post<{ url: string }>('/Catalogo/enlace');

export const renovarEnlaceCatalogo = () => post<{ url: string }>('/Catalogo/enlace/renovar');

// ===== REGISTRADOR DE ASISTENCIAS =====
export const configurarAsistencias = (activas: boolean) =>
  api<MarcaAcademia>('/Academia/asistencias', { method: 'PUT', body: JSON.stringify({ activas }) });

export type RegistroAsistencia = {
  id: string;
  alumnoId: string;
  nombreAlumno: string;
  // ISO en UTC
  fechaHora: string;
  permitirAcceso: boolean;
  estatusFinanciero: string;
};

export const obtenerAsistencias = (desde: Date, hasta: Date) =>
  api<RegistroAsistencia[]>(`/Asistencias?desde=${encodeURIComponent(desde.toISOString())}&hasta=${encodeURIComponent(hasta.toISOString())}`);

// ===== SUCURSALES =====
export type DatosSucursal = { nombre: string; direccion?: string; telefono?: string };

export type Sucursal = {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  esPrincipal: boolean;
  // La sede en la que trabaja la sesión
  actual: boolean;
};

export const configurarSucursales = (activas: boolean) =>
  api<MarcaAcademia>('/Academia/sucursales', { method: 'PUT', body: JSON.stringify({ activas }) });

export const obtenerSucursales = () => api<Sucursal[]>('/Sucursales');

export const crearSucursal = (datos: DatosSucursal) => post<Sucursal>('/Sucursales', datos);

export const editarSucursal = (id: string, datos: DatosSucursal) =>
  api<Sucursal>(`/Sucursales/${id}`, { method: 'PUT', body: JSON.stringify(datos) });

// Borra la sucursal con todos sus datos (no la principal ni la de la sesión)
export const eliminarSucursal = (id: string) => api<Mensaje>(`/Sucursales/${id}`, { method: 'DELETE' });

// Devuelve el token de la sesión apuntando a la otra sucursal
export const entrarASucursal = (id: string) => post<{ token: string; sucursal: Sucursal }>(`/Sucursales/${id}/cambiar`);
