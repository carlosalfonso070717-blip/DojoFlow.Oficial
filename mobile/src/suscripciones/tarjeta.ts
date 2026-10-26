import type { DatosTarjeta, ErroresTarjeta, MarcaTarjeta } from './tipos';

// Validación y formato de tarjetas del lado del cliente. La pasarela real vuelve a validar;
// esto solo evita mandar datos que de antemano sabemos que serán rechazados.

export const soloDigitos = (v: string) => v.replace(/\D/g, '');

export function marcaDe(numero: string): MarcaTarjeta {
  const n = soloDigitos(numero);
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return 'desconocida';
}

export const largoNumero = (marca: MarcaTarjeta) => (marca === 'amex' ? 15 : 16);
export const largoCvv = (marca: MarcaTarjeta) => (marca === 'amex' ? 4 : 3);

// 4242 4242 4242 4242 · Amex: 3782 822463 10005
export function formatearNumero(valor: string) {
  const marca = marcaDe(valor);
  const n = soloDigitos(valor).slice(0, largoNumero(marca));
  const grupos = marca === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];
  const partes: string[] = [];
  let i = 0;
  for (const g of grupos) {
    if (i >= n.length) break;
    partes.push(n.slice(i, i + g));
    i += g;
  }
  return partes.join(' ');
}

export function formatearVencimiento(valor: string) {
  const n = soloDigitos(valor).slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
}

// Algoritmo de Luhn: detecta errores de captura en el número
export function luhnValido(numero: string) {
  const n = soloDigitos(numero);
  let suma = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
  }
  return n.length > 0 && suma % 10 === 0;
}

export function validarTarjeta(datos: DatosTarjeta, hoy = new Date()): ErroresTarjeta {
  const errores: ErroresTarjeta = {};
  const marca = marcaDe(datos.numero);

  if (datos.titular.trim().length < 3) errores.titular = 'Escribe el nombre como aparece en la tarjeta';

  const numero = soloDigitos(datos.numero);
  if (numero.length !== largoNumero(marca) || !luhnValido(numero)) errores.numero = 'Revisa el número de la tarjeta';

  const [mm, aa] = datos.vencimiento.split('/').map(Number);
  const vence = new Date(2000 + (aa || 0), mm || 0, 1); // primer día del mes siguiente al vencimiento
  if (!mm || mm > 12 || !aa || vence <= hoy) errores.vencimiento = 'Fecha no válida';

  if (soloDigitos(datos.cvv).length !== largoCvv(marca)) errores.cvv = marca === 'amex' ? '4 dígitos' : '3 dígitos';

  return errores;
}

export const ultimos4 = (numero: string) => soloDigitos(numero).slice(-4);
