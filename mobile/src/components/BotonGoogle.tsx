import { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@/auth/google';
import { useTema } from '@/theme';
import { alerta } from '@/utils/alerta';
import { LogoGoogle } from './iconos/LogoGoogle';
import { Presionable } from './Presionable';

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

// Recibe el ID token de Google; la pantalla decide si inicia sesión o registra
type Props = { onToken: (idToken: string) => Promise<void> };

// Botón redondo de solo ícono: nunca muestra el nombre ni el correo de la cuenta de Google
export function BotonGoogle({ onToken }: Props) {
  const { color } = useTema();
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
      await onToken(respuesta.data.idToken);
    } catch (e) {
      if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return;
      alerta('No se pudo continuar con Google', (e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Presionable
      onPress={presionar}
      disabled={cargando}
      accessibilityRole="button"
      accessibilityLabel="Continuar con Google"
      style={[estilos.boton, { backgroundColor: color.superficie, borderColor: color.bordeFuerte }]}
    >
      {cargando ? <ActivityIndicator color={color.textoSuave} /> : <LogoGoogle size={22} />}
    </Presionable>
  );
}

const estilos = StyleSheet.create({
  boton: { width: 48, height: 48, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
});
