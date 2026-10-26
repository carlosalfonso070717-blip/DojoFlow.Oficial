// Tipos del dominio de suscripciones. Son el contrato con la API: cuando existan los
// endpoints reales deben devolver estas mismas formas y el resto de la app no cambia.

export type IdPlan = 'gestiona' | 'gestiona-plus' | 'gestiona-premium';

export type Periodo = 'mensual' | 'anual';

export type Plan = {
  id: IdPlan;
  nombre: string;
  lema: string;
  // Precios en la moneda del plan, sin centavos
  precioMensual: number;
  precioAnual: number;
  moneda: 'MXN';
  beneficios: string[];
  // El plan que se recomienda (insignia "Más elegido")
  recomendado?: boolean;
};

export type MarcaTarjeta = 'visa' | 'mastercard' | 'amex' | 'desconocida';

// Lo que la persona escribe en el formulario (nunca se guarda en el dispositivo)
export type DatosTarjeta = {
  titular: string;
  numero: string;
  vencimiento: string; // MM/AA
  cvv: string;
};

export type ErroresTarjeta = Partial<Record<keyof DatosTarjeta, string>>;

export type SolicitudCobro = {
  // Token de la academia recién creada: con él la API sabrá a quién activar el plan
  tokenAcademia: string | null;
  plan: Plan;
  periodo: Periodo;
  monto: number;
  tarjeta: DatosTarjeta;
};

export type ResultadoCobro =
  | { aprobado: true; referencia: string; ultimos4: string; marca: MarcaTarjeta }
  | { aprobado: false; motivo: string };

export type Suscripcion = {
  plan: Plan;
  periodo: Periodo;
  monto: number;
  referencia: string;
  ultimos4: string;
  marca: MarcaTarjeta;
  inicio: string; // ISO
  renovacion: string; // ISO
};
