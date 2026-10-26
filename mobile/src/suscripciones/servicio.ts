import { fechaRenovacion, precioDe } from './catalogo';
import { pasarela } from './pasarela';
import { validarTarjeta } from './tarjeta';
import type { DatosTarjeta, Periodo, Plan, Suscripcion } from './tipos';

export class ErrorPago extends Error {}

// Caso de uso "contratar plan": valida, cobra y devuelve la suscripción activa.
// Hoy todo pasa en el cliente con la pasarela simulada; con reglas de negocio reales,
// el cobro y la activación los confirma la API (p. ej. POST /Suscripciones con el token
// de la pasarela) y aquí solo se cambia el paso 3.
export async function contratarPlan({
  tokenAcademia,
  plan,
  periodo,
  tarjeta,
}: {
  tokenAcademia: string | null;
  plan: Plan;
  periodo: Periodo;
  tarjeta: DatosTarjeta;
}): Promise<Suscripcion> {
  // 1. Datos completos y bien escritos
  if (Object.keys(validarTarjeta(tarjeta)).length > 0) throw new ErrorPago('Revisa los datos de la tarjeta.');

  // 2. Cobro
  const monto = precioDe(plan, periodo);
  const resultado = await pasarela.cobrar({ tokenAcademia, plan, periodo, monto, tarjeta });
  if (!resultado.aprobado) throw new ErrorPago(resultado.motivo);

  // 3. Activación del plan (por ahora local; aquí irá la llamada a la API)
  const inicio = new Date();
  return {
    plan,
    periodo,
    monto,
    referencia: resultado.referencia,
    ultimos4: resultado.ultimos4,
    marca: resultado.marca,
    inicio: inicio.toISOString(),
    renovacion: fechaRenovacion(periodo, inicio).toISOString(),
  };
}

export { pasarela };
