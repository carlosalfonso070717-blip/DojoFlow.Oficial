import type { Periodo, Plan } from './tipos';

// Catálogo de planes de prueba. Cuando exista el endpoint, obtenerPlanes() hará
// `api<Plan[]>('/Planes')` y estos datos se pueden borrar.
const PLANES: Plan[] = [
  {
    id: 'gestiona',
    nombre: 'Gestiona',
    lema: 'Lo esencial para arrancar en orden.',
    precioMensual: 299,
    precioAnual: 2990,
    moneda: 'MXN',
    beneficios: ['Hasta 50 alumnos', 'Cobros y recibos automáticos', 'Inventario y ventas', 'Una sucursal'],
  },
  {
    id: 'gestiona-plus',
    nombre: 'Gestiona Plus',
    lema: 'Para academias que ya están creciendo.',
    precioMensual: 599,
    precioAnual: 5990,
    moneda: 'MXN',
    beneficios: ['Hasta 200 alumnos', 'Todo lo de Gestiona', 'Registrador de asistencias', 'Reportes financieros en PDF'],
    recomendado: true,
  },
  {
    id: 'gestiona-premium',
    nombre: 'Gestiona Premium',
    lema: 'Varias sedes, sin límites.',
    precioMensual: 999,
    precioAnual: 9990,
    moneda: 'MXN',
    beneficios: ['Alumnos ilimitados', 'Todo lo de Plus', 'Varias sucursales', 'Soporte prioritario'],
  },
];

export async function obtenerPlanes(): Promise<Plan[]> {
  return PLANES;
}

export const precioDe = (plan: Plan, periodo: Periodo) => (periodo === 'anual' ? plan.precioAnual : plan.precioMensual);

// Lo que se ahorra al pagar el año completo frente a doce meses sueltos
export const ahorroAnual = (plan: Plan) => plan.precioMensual * 12 - plan.precioAnual;

export const formatoPrecio = (n: number) => `$${n.toLocaleString('es-MX')}`;

// Siguiente cobro a partir de hoy
export function fechaRenovacion(periodo: Periodo, desde = new Date()) {
  const fecha = new Date(desde);
  if (periodo === 'anual') fecha.setFullYear(fecha.getFullYear() + 1);
  else fecha.setMonth(fecha.getMonth() + 1);
  return fecha;
}

export const formatoFecha = (fecha: Date) => fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
