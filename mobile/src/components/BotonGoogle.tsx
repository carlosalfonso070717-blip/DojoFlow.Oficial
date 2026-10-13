import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, type CredencialGoogle } from '@/auth/google';
import { alerta } from '@/utils/alerta';
import { Boton } from './Boton';
import { LogoGoogle } from './iconos/LogoGoogle';

type ModuloGoogle = typeof import('@react-native-google-signin/google-signin');

// El módulo es nativo: en Expo Go no existe y el botón simplemente no aparece
let google: ModuloGoogle | null = null;
if (GOOGLE_WEB_CLIENT_ID) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    google = require('@react-native-google-signin/google-signin') as ModuloGoogle;
    google.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
  } catch {
    google = null;
  }
}

export const googleDisponible = !!google;

type Props = {
  // Recibe la credencial de Google; la pantalla decide si inicia sesión o registra
  onToken: (credencial: CredencialGoogle) => Promise<void>;
  style?: StyleProp<ViewStyle>;
};

// Botón del ancho completo, como los demás; nunca muestra el nombre ni el correo de la cuenta
export function BotonGoogle({ onToken, style }: Props) {
  const [cargando, setCargando] = useState(false);
  if (!google) return null;
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = google;

  async function presionar() {
    setCargando(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const respuesta = await GoogleSignin.signIn();
      if (!isSuccessResponse(respuesta)) return; // canceló
      // Se cierra la sesión de Google en el dispositivo para que la próxima vez pueda elegir otra cuenta
      GoogleSignin.signOut().catch(() => {});
      if (!respuesta.data.idToken) throw new Error('Google no devolvió la credencial. Vuelve a intentarlo.');
      await onToken({ idToken: respuesta.data.idToken });
    } catch (e) {
      if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return;
      alerta('No se pudo continuar con Google', (e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return <Boton titulo="Continuar con Google" variante="contorno" icono={LogoGoogle} onPress={presionar} cargando={cargando} style={style} />;
}
