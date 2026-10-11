import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { onSesionExpirada, setToken } from '@/api/client';
import { crearSesionKiosco, login, obtenerPerfil, type Perfil } from '@/api/endpoints';

// Mismas llaves que usa el frontend web en localStorage
const LLAVE_TOKEN = 'coachToken';
const LLAVE_KIOSCO = 'kioscoToken';

type Sesion = {
  token: string | null;
  perfil: Perfil | null;
  cargando: boolean;
  // Token de la tablet de recepción; sobrevive al cierre de sesión del coach
  tokenKiosco: string | null;
  iniciarSesion: (email: string, password: string) => Promise<string>;
  // Para entrar directo con el token que devuelve el registro de academia
  entrarConToken: (token: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  recargarPerfil: () => Promise<void>;
  vincularKiosco: () => Promise<void>;
};

const SesionContext = createContext<Sesion | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [tokenKiosco, setTokenKiosco] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const guardar = useCallback(async (nuevo: string | null) => {
    setToken(nuevo);
    if (nuevo) {
      await SecureStore.setItemAsync(LLAVE_TOKEN, nuevo);
      // El perfil se carga antes de exponer el token para que la app ya se pinte con la academia
      try {
        setPerfil(await obtenerPerfil());
      } catch {
        setPerfil(null);
      }
    } else {
      await SecureStore.deleteItemAsync(LLAVE_TOKEN);
      setPerfil(null);
    }
    setTokenState(nuevo);
  }, []);

  useEffect(() => {
    (async () => {
      const [guardado, kiosco] = await Promise.all([
        SecureStore.getItemAsync(LLAVE_TOKEN),
        SecureStore.getItemAsync(LLAVE_KIOSCO),
      ]);
      setTokenKiosco(kiosco);
      if (guardado) await guardar(guardado);
    })().finally(() => setCargando(false));
  }, [guardar]);

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

  const entrarConToken = useCallback((nuevo: string) => guardar(nuevo), [guardar]);

  const cerrarSesion = useCallback(() => guardar(null), [guardar]);

  const recargarPerfil = useCallback(async () => {
    setPerfil(await obtenerPerfil());
  }, []);

  const vincularKiosco = useCallback(async () => {
    const { token: nuevo } = await crearSesionKiosco();
    await SecureStore.setItemAsync(LLAVE_KIOSCO, nuevo);
    setTokenKiosco(nuevo);
  }, []);

  return (
    <SesionContext.Provider
      value={{
        token,
        perfil,
        cargando,
        tokenKiosco,
        iniciarSesion,
        entrarConToken,
        cerrarSesion,
        recargarPerfil,
        vincularKiosco,
      }}
    >
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error('useSesion debe usarse dentro de <SessionProvider>');
  return ctx;
}
