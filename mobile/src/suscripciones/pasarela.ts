import { marcaDe, soloDigitos, ultimos4 } from './tarjeta';
import type { ResultadoCobro, SolicitudCobro } from './tipos';

// Puerto de la pasarela de pago. Cualquier proveedor (Stripe, Mercado Pago, Conekta...)
// se integra escribiendo un adaptador con esta forma y cambiando `pasarela` abajo.
// Importante: el adaptador real debe tokenizar la tarjeta con el SDK del proveedor y mandar
// a nuestra API solo el token, nunca el número ni el CVV.
export interface Pasarela {
  readonly modoPrueba: boolean;
  cobrar(solicitud: SolicitudCobro): Promise<ResultadoCobro>;
}

// Tarjetas de prueba (las mismas convenciones que usan las pasarelas reales)
export const TARJETAS_PRUEBA = {
  aprobada: '4242 4242 4242 4242',
  rechazada: '4000 0000 0000 0002',
  sinFondos: '4000 0000 0000 9995',
};

const RECHAZOS: Record<string, string> = {
  [soloDigitos(TARJETAS_PRUEBA.rechazada)]: 'El banco rechazó el cargo. Prueba con otra tarjeta.',
  [soloDigitos(TARJETAS_PRUEBA.sinFondos)]: 'La tarjeta no tiene fondos suficientes.',
};

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Simula el viaje a la pasarela: tarda como una real y responde aprobado o rechazado
// según la tarjeta. No se cobra nada ni sale ningún dato del dispositivo.
export const pasarelaSimulada: Pasarela = {
  modoPrueba: true,
  async cobrar({ tarjeta }) {
    await esperar(1800);
    const numero = soloDigitos(tarjeta.numero);
    const motivo = RECHAZOS[numero];
    if (motivo) return { aprobado: false, motivo };
    return {
      aprobado: true,
      referencia: `GA-${Date.now().toString(36).toUpperCase()}`,
      ultimos4: ultimos4(numero),
      marca: marcaDe(numero),
    };
  },
};

// Único punto a cambiar para usar una pasarela real
export const pasarela: Pasarela = pasarelaSimulada;
