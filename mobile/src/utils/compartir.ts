import { Linking, Platform, Share } from 'react-native';
import { alerta } from './alerta';

const esWeb = Platform.OS === 'web';

// En el celular siempre hay menú de compartir. En la web solo en navegadores de celular/tableta:
// en la computadora navigator.share abre (si existe) un menú del sistema poco claro,
// así que ahí se ofrece copiar el enlace.
export function puedeCompartir() {
  if (!esWeb) return true;
  return typeof navigator.share === 'function' && window.matchMedia?.('(pointer: coarse)').matches;
}

// Comparte un enlace con el menú del sistema; si no hay menú o falla, lo copia
export async function compartirEnlace(mensaje: string, url: string) {
  if (!esWeb) {
    // Android solo usa `message`; iOS usa `url` y muestra la vista previa
    await Share.share(Platform.OS === 'ios' ? { message: mensaje, url } : { message: `${mensaje} ${url}` });
    return;
  }

  if (puedeCompartir()) {
    try {
      await navigator.share({ text: mensaje, url });
      return;
    } catch (e) {
      // La persona cerró el menú: no hay nada más que hacer
      if ((e as Error).name === 'AbortError') return;
    }
  }
  await copiarEnlace(url);
}

export async function copiarEnlace(url: string) {
  // En el celular no hay portapapeles sin un módulo extra: el menú de compartir ya incluye "Copiar"
  if (!esWeb) {
    await Share.share({ message: url });
    return;
  }
  if (await copiarTexto(url)) {
    alerta('Enlace copiado', 'Pégalo en WhatsApp, Instagram o donde quieras compartirlo.');
  } else {
    alerta('No se pudo copiar', `Copia el enlace manualmente:\n${url}`);
  }
}

export function abrirEnlace(url: string) {
  if (esWeb) window.open(url, '_blank', 'noopener');
  else Linking.openURL(url).catch(() => alerta('No se pudo abrir el enlace', url));
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Sin permiso o fuera de HTTPS: el método clásico con un campo de texto temporal
    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('readonly', '');
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.appendChild(campo);
    campo.select();
    const ok = document.execCommand('copy');
    campo.remove();
    return ok;
  }
}
