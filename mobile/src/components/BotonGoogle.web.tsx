import { useEffect, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { GOOGLE_WEB_CLIENT_ID, type CredencialGoogle } from '@/auth/google';
import { alerta } from '@/utils/alerta';
import { Boton } from './Boton';
import { LogoGoogle } from './iconos/LogoGoogle';

// En el navegador se usa el flujo OAuth de Google Identity Services con ventana emergente:
// el botón es nuestro (nunca muestra la cuenta) y Google entrega un access token que la API valida
type ClienteToken = { requestAccessToken: (opciones?: { prompt?: string }) => void };
type RespuestaToken = { access_token?: string; error?: string; error_description?: string };
type Gis = {
  accounts: {
    oauth2: {
      initTokenClient: (opciones: {
        client_id: string;
        scope: string;
        callback: (r: RespuestaToken) => void;
        error_callback?: (e: { type?: string; message?: string }) => void;
      }) => ClienteToken;
    };
  };
};

let cargaGis: Promise<Gis> | null = null;

function cargarGis(): Promise<Gis> {
  cargaGis ??= new Promise<Gis>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve((window as unknown as { google: Gis }).google);
    script.onerror = () => {
      cargaGis = null;
      reject(new Error('No se pudo cargar el acceso con Google.'));
    };
    document.head.appendChild(script);
  });
  return cargaGis;
}

export const googleDisponible = !!GOOGLE_WEB_CLIENT_ID;

type Props = {
  onToken: (credencial: CredencialGoogle) => Promise<void>;
  style?: StyleProp<ViewStyle>;
};

export function BotonGoogle({ onToken, style }: Props) {
  const [cargando, setCargando] = useState(false);
  const cliente = useRef<ClienteToken | null>(null);
  // El callback se registra una vez; así siempre llama a la versión actual de onToken
  const alRecibir = useRef(onToken);
  useEffect(() => {
    alRecibir.current = onToken;
  }, [onToken]);

  // El cliente se prepara antes del clic: el navegador solo permite abrir la ventana durante el clic mismo
  useEffect(() => {
    if (!GOOGLE_WEB_CLIENT_ID) return;
    cargarGis()
      .then((gis) => {
        cliente.current = gis.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_WEB_CLIENT_ID!,
          scope: 'openid email profile',
          callback: (r) => {
            if (!r.access_token) {
              setCargando(false);
              if (r.error !== 'access_denied') alerta('No se pudo continuar con Google', r.error_description ?? 'Vuelve a intentarlo.');
              return;
            }
            alRecibir
              .current({ accessToken: r.access_token })
              .catch((e: Error) => alerta('No se pudo continuar con Google', e.message))
              .finally(() => setCargando(false));
          },
          // Cerró la ventana o el navegador la bloqueó
          error_callback: () => setCargando(false),
        });
      })
      .catch(() => {});
  }, []);

  if (!GOOGLE_WEB_CLIENT_ID) return null;

  function presionar() {
    if (!cliente.current) {
      alerta('Un momento', 'El acceso con Google aún se está cargando. Vuelve a intentarlo en unos segundos.');
      return;
    }
    setCargando(true);
    cliente.current.requestAccessToken({ prompt: 'select_account' });
  }

  return <Boton titulo="Continuar con Google" variante="contorno" icono={LogoGoogle} onPress={presionar} cargando={cargando} style={style} />;
}
