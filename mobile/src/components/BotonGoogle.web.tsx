import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GOOGLE_WEB_CLIENT_ID } from '@/auth/google';
import { useTema } from '@/theme';
import { alerta } from '@/utils/alerta';

// En el navegador se usa el botón oficial de Google Identity Services: entrega el ID token directo
type Gis = {
  accounts: {
    id: {
      initialize: (opciones: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: 'popup' }) => void;
      renderButton: (contenedor: HTMLElement, opciones: Record<string, unknown>) => void;
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
  onToken: (idToken: string) => Promise<void>;
  texto?: 'continuar' | 'registro';
};

export function BotonGoogle({ onToken, texto = 'continuar' }: Props) {
  const { oscuro } = useTema();
  const contenedor = useRef<View>(null);
  const [ancho, setAncho] = useState(0);
  const [cargando, setCargando] = useState(false);
  // El callback de Google se registra una vez; así siempre llama a la versión actual de onToken
  const alRecibir = useRef(onToken);
  useEffect(() => {
    alRecibir.current = onToken;
  }, [onToken]);

  useEffect(() => {
    const nodo = contenedor.current as unknown as HTMLElement | null;
    if (!GOOGLE_WEB_CLIENT_ID || !nodo || !ancho) return;
    let vigente = true;

    cargarGis()
      .then((gis) => {
        if (!vigente) return;
        gis.accounts.id.initialize({
          client_id: GOOGLE_WEB_CLIENT_ID!,
          ux_mode: 'popup',
          callback: ({ credential }) => {
            setCargando(true);
            alRecibir
              .current(credential)
              .catch((e: Error) => alerta('No se pudo continuar con Google', e.message))
              .finally(() => setCargando(false));
          },
        });
        nodo.innerHTML = '';
        gis.accounts.id.renderButton(nodo, {
          type: 'standard',
          theme: oscuro ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text: texto === 'registro' ? 'signup_with' : 'continue_with',
          logo_alignment: 'center',
          locale: 'es',
          // Google acepta como máximo 400 px
          width: Math.min(400, Math.floor(ancho)),
        });
      })
      .catch(() => {});

    return () => {
      vigente = false;
    };
  }, [ancho, oscuro, texto]);

  if (!GOOGLE_WEB_CLIENT_ID) return null;

  return (
    <View style={estilos.marco} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      <View ref={contenedor} style={[estilos.boton, cargando && { opacity: 0.4 }]} pointerEvents={cargando ? 'none' : 'auto'} />
      {cargando && <ActivityIndicator style={StyleSheet.absoluteFill} />}
    </View>
  );
}

const estilos = StyleSheet.create({
  marco: { width: '100%', minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  boton: { alignItems: 'center' },
});
