import { registrarAcademia, subirLogo } from '@/api/endpoints';
import type { Borrador } from './RegistroContexto';

// Crea la academia con lo elegido en el asistente y devuelve el token de su dueño.
// Con Google no se mandan correo ni contraseña: la API los toma del token de Google.
export async function crearAcademia(borrador: Borrador): Promise<string> {
  const credencial = borrador.google?.credencial;
  const cuenta = credencial
    ? 'idToken' in credencial
      ? { googleIdToken: credencial.idToken }
      : { googleAccessToken: credencial.accessToken }
    : { email: borrador.email.trim(), password: borrador.password };

  const { token } = await registrarAcademia({
    ...cuenta,
    nombre: borrador.nombre.trim(),
    nombreAcademia: borrador.nombreAcademia.trim(),
    tipoNegocio: borrador.tipoNegocio,
    colorPrimario: borrador.colorPrimario,
    colorSecundario: borrador.colorSecundario,
    terminoAlumno: borrador.terminoAlumno.trim(),
    clases: borrador.clases.map((c) => ({ nombre: c.nombre, precio: parseFloat(c.precio) || 0 })),
    ...(borrador.variasSucursales && {
      nombreSucursal: borrador.nombreSucursal.trim(),
      sucursales: borrador.sucursales
        .filter((s) => s.nombre.trim())
        .map((s) => ({ nombre: s.nombre.trim(), direccion: s.direccion.trim() || undefined, telefono: s.telefono.trim() || undefined })),
    }),
  });

  // El logo es opcional: si falla la subida, la academia ya existe y se puede subir en Ajustes
  if (borrador.logo) await subirLogo(borrador.logo, token).catch(() => {});
  return token;
}
