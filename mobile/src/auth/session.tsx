import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { onSesionExpirada, setToken } from '@/api/client';
import type { CredencialGoogle } from './google';
import { continuarConGoogle, crearSesionKiosco, entrarASucursal, login, obtenerPerfil, type Perfil, type Sucursal } from '@/api/endpoints';
import { almacen } from './almacen';

// Mismas llaves que usa el frontend web en localStorage
const LLAVE_TOKEN = 'coachToken';
const LLAVE_KIOSCO = 'kioscoToken';

// Lo que dura el recorrido de una sucursal a otra, aunque la API conteste antes: así se alcanza a ver
export const DURACION_VIAJE = 2200;
// Lo que se queda la escena después de llegar, antes de desvanecerse
const PAUSA_LLEGADA = 650;

// Cambio de sucursal en curso: la animación muestra de dónde sale y a dónde llega
export type Viaje = { desde: string; hacia: string; llego: boolean };

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Sesion = {
  token: string | null;
  perfil: Perfil | null;
  cargando: boolean;
  // Token de la tablet de recepción; sobrevive al cierre de sesión del coach
  tokenKiosco: string | null;
  iniciarSesion: (email: string, password: string) => Promise<string>;
  // Entra si el correo de Google ya tiene cuenta; si no, devuelve sus datos para registrarse
  entrarConGoogle: (credencial: CredencialGoogle) => Promise<{ registrado: true } | { registrado: false; email: string; nombre: string }>;
  // Para entrar directo con el token que devuelve el registro de academia
  entrarConToken: (token: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  recargarPerfil: () => Promise<void>;
  vincularKiosco: () => Promise<void>;
  viaje: Viaje | null;
  // Cambia la sesión a otra sucursal del mismo negocio (con su animación)
  cambiarSucursal: (destino: Sucursal) => Promise<void>;
};

const SesionContext = createContext<Sesion | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [tokenKiosco, setTokenKiosco] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const viajando = useRef(false);

  const guardar = useCallback(async (nuevo: string | null) => {
    setToken(nuevo);
    if (nuevo) {
      await almacen.guardar(LLAVE_TOKEN, nuevo);
      // El perfil se carga antes de exponer el token para que la app ya se pinte con la academia
      try {
        setPerfil(await obtenerPerfil());
      } catch {
        setPerfil(null);
      }
    } else {
      await almacen.borrar(LLAVE_TOKEN);
      setPerfil(null);
    }
    setTokenState(nuevo);
  }, []);

  useEffect(() => {
    (async () => {
      const [guardado, kiosco] = await Promise.all([
        almacen.leer(LLAVE_TOKEN),
        almacen.leer(LLAVE_KIOSCO),
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

  const entrarConGoogle = useCallback(
    async (credencial: CredencialGoogle) => {
      const r = await continuarConGoogle(credencial);
      if (!r.registrado) return r;
      await guardar(r.token);
      return { registrado: true as const };
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
    await almacen.guardar(LLAVE_KIOSCO, nuevo);
    setTokenKiosco(nuevo);
  }, []);

  const cambiarSucursal = useCallback(
    async (destino: Sucursal) => {
      if (viajando.current) return;
      viajando.current = true;
      const desde = perfil?.academia.nombreSucursal || perfil?.academia.nombre || '';
      setViaje({ desde, hacia: destino.nombre, llego: false });
      const inicio = Date.now();
      try {
        const { token: nuevo } = await entrarASucursal(destino.id);
        await esperar(DURACION_VIAJE - (Date.now() - inicio));
        // Con la escena aún encima se cambia todo: token, perfil y pantalla de inicio de la otra sucursal
        await guardar(nuevo);
        router.navigate('/');
        setViaje((v) => v && { ...v, llego: true });
        await esperar(PAUSA_LLEGADA);
      } finally {
        setViaje(null);
        viajando.current = false;
      }
    },
    [perfil, guardar],
  );

  return (
    <SesionContext.Provider
      value={{
        token,
        perfil,
        cargando,
        tokenKiosco,
        iniciarSesion,
        entrarConGoogle,
        entrarConToken,
        cerrarSesion,
        recargarPerfil,
        vincularKiosco,
        viaje,
        cambiarSucursal,
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
