import { Alert, Platform, type AlertButton } from 'react-native';

// Alert.alert no hace nada en el navegador: en web se usan los diálogos del propio navegador
export function alerta(titulo: string, mensaje?: string, botones?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(titulo, mensaje, botones);
    return;
  }

  const texto = mensaje ? `${titulo}\n\n${mensaje}` : titulo;
  const acciones = (botones ?? []).filter((b) => b.style !== 'cancel');

  // Un solo botón (o ninguno): aviso simple
  if (acciones.length <= 1 && !(botones ?? []).some((b) => b.style === 'cancel')) {
    window.alert(texto);
    acciones[0]?.onPress?.();
    return;
  }

  // Con "Cancelar" + una acción: confirmación
  if (window.confirm(texto)) acciones[acciones.length - 1]?.onPress?.();
  else (botones ?? []).find((b) => b.style === 'cancel')?.onPress?.();
}
