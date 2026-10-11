import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { onSesionExpirada, setToken } from '@/api/client';
import { login } from '@/api/endpoints';

// Misma llave que usa el frontend web en localStorage
const LLAVE_TOKEN = 'coachToken';

type Sesion = {
  token: string | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<string>;
  cerrarSesion: () => Promise<void>;
};

const SesionContext = createContext<Sesion | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const guardar = useCallback(async (nuevo: string | null) => {
    setToken(nuevo);
    setTokenState(nuevo);
    if (nuevo) await SecureStore.setItemAsync(LLAVE_TOKEN, nuevo);
    else await SecureStore.deleteItemAsync(LLAVE_TOKEN);
  }, []);

  useEffect(() => {
    SecureStore.getItemAsync(LLAVE_TOKEN)
      .then((guardado) => {
        setToken(guardado);
        setTokenState(guardado);
      })
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    onSesionExpirada(() => void guardar(null));
  }, [guardar]);

  const iniciarSesion = useCallback(
    async (email: string, password: string) => {
      const data = await login(email, password);
      await guardar(data.token);
      return data.mensaje;
    },
    [guardar],
  );

  const cerrarSesion = useCallback(() => guardar(null), [guardar]);

  return (
    <SesionContext.Provider value={{ token, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error('useSesion debe usarse dentro de <SessionProvider>');
  return ctx;
}
