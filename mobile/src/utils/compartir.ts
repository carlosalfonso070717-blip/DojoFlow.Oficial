import { Platform, Share } from 'react-native';
import { alerta } from './alerta';

// Comparte un enlace con el menú del sistema; en navegadores sin ese menú, lo copia
export async function compartirEnlace(mensaje: string, url: string) {
  if (Platform.OS !== 'web') {
    await Share.share({ message: mensaje, url });
    return;
  }

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: mensaje, url });
      return;
    } catch {
      // La persona cerró el menú o el navegador lo bloqueó: se copia como respaldo
    }
  }

  await navigator.clipboard.writeText(url);
  alerta('Enlace copiado', 'Pégalo en WhatsApp, Instagram o donde quieras compartirlo.');
}
