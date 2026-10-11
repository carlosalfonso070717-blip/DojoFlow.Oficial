import { api } from './client';

// ===== AUTH =====
export type LoginRespuesta = { token: string; mensaje: string };

type Mensaje = { mensaje: string };

const post = <T>(ruta: string, body?: unknown) =>
  api<T>(ruta, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const login = (email: string, password: string) =>
  post<LoginRespuesta>('/Auth/login', { email, password });

export const enviarVerificacion = (email: string) =>
  post<Mensaje>('/Auth/enviar-verificacion', { email });

export const confirmarVerificacion = (email: string, pin: string) =>
  post<Mensaje>('/Auth/confirmar-verificacion', { email, pin });

export const registrarCoach = (datos: {
  nombre: string;
  email: string;
  password: string;
  codigoInvitacion: string;
}) => post<Mensaje>('/Auth/signup', datos);

export const olvidePassword = (email: string) => post<Mensaje>('/Auth/olvide-password', { email });

export const resetearPassword = (email: string, pin: string, nuevaPassword: string) =>
  post<Mensaje>('/Auth/resetear-password', { email, pin, nuevaPassword });

// ===== ALUMNOS =====
export const DISCIPLINAS = ['MMA', 'Boxeo', 'JiuJitsu', 'Kickboxing', 'Judo'] as const;

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

// ===== ASISTENCIAS (kiosco, no requiere token) =====
export type ResultadoChequeo = {
  nombreCompleto: string;
  disciplinas: string[];
  estatusFinanciero: string;
  fechaHora: string;
  permitirAcceso: boolean;
};

export const checarAsistencia = (pin: string) =>
  post<ResultadoChequeo>(`/Asistencias/checar?pin=${encodeURIComponent(pin)}`);

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
};

export const obtenerInventario = () => api<Producto[]>('/Inventario');

export const obtenerAlertasInventario = () => api<string[]>('/Inventario/alertas');

export const agregarProducto = (datos: { nombre: string; cantidad: number; stockMinimo: number }) =>
  post<Producto>('/Inventario', datos);

// La API sobrescribe ImagenUrl en cada PUT, por eso siempre se manda la actual
export const editarProducto = (
  id: string,
  datos: { nombre: string; nuevoStockActual: number; nuevoStockMinimo: number; imagenUrl: string },
) => api<Mensaje>(`/Inventario/${id}`, { method: 'PUT', body: JSON.stringify(datos) });

export const eliminarProducto = (id: string) => api<Mensaje>(`/Inventario/${id}`, { method: 'DELETE' });

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
