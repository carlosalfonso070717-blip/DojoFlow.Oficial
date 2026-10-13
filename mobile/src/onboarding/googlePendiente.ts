// Cuenta de Google que aún no tiene academia: el login la deja aquí y el registro la toma
// para no volver a pedir correo, contraseña ni código. Vive solo en memoria.
import type { CredencialGoogle } from '@/auth/google';

export type CuentaGoogle = { credencial: CredencialGoogle; email: string; nombre: string };

let pendiente: CuentaGoogle | null = null;

export function dejarCuentaGoogle(cuenta: CuentaGoogle | null) {
  pendiente = cuenta;
}

export const cuentaGooglePendiente = () => pendiente;
