import { Alert } from 'react-native';

export { Boton } from './Boton';
export { Campo } from './Campo';
export { Credencial, DatoCredencial } from './Credencial';
export { Avatar, Chip, EstadoVacio, Insignia, Superficie, urlAbsoluta, type TonoInsignia } from './Elementos';
export { Fila, Grupo, ItemGrupo, ParDato } from './Grupo';
export { Hoja } from './Hoja';
export { BotonIcono, Buscador, Encabezado } from './Pantalla';
export { Presionable } from './Presionable';
export { Texto } from './Texto';

// Confirmación nativa antes de acciones que no se pueden deshacer
export function confirmar(
  titulo: string,
  mensaje: string | undefined,
  textoConfirmar: string,
  accion: () => Promise<unknown>,
  destructivo = true,
) {
  Alert.alert(titulo, mensaje, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: textoConfirmar,
      style: destructivo ? 'destructive' : 'default',
      onPress: () => {
        accion().catch((e: Error) => Alert.alert('No se pudo completar', e.message));
      },
    },
  ]);
}

export const formatoMoneda = (n: number) =>
  `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Cifras cortas para resúmenes: $18.5k
export const formatoCorto = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toLocaleString('es-MX', { maximumFractionDigits: 1 })}k` : `$${n.toLocaleString('es-MX')}`;
