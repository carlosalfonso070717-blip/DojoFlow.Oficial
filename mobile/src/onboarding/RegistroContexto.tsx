import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { obtenerTiposNegocio, type MarcaAcademia, type TipoNegocio } from '@/api/endpoints';
import type { ArchivoLogo } from '@/utils/logo';

export type ClaseBorrador = { nombre: string; precio: string };

export type Borrador = {
  nombreAcademia: string;
  tipoNegocio: string;
  terminoAlumno: string;
  colorPrimario: string;
  colorSecundario: string;
  logo: ArchivoLogo | null;
  clases: ClaseBorrador[];
  nombre: string;
  email: string;
  password: string;
};

const INICIAL: Borrador = {
  nombreAcademia: '',
  tipoNegocio: '',
  terminoAlumno: 'Alumno',
  colorPrimario: '#d90429',
  colorSecundario: '#14161a',
  logo: null,
  clases: [],
  nombre: '',
  email: '',
  password: '',
};

// Orden de las pantallas del asistente; la barra de progreso se calcula con esto
export const PASOS = ['index', 'tipo', 'alumnos', 'colores', 'logo', 'clases', 'cuenta', 'verificar'] as const;
export type Paso = (typeof PASOS)[number];

type Contexto = {
  borrador: Borrador;
  actualizar: (cambios: Partial<Borrador>) => void;
  tipos: TipoNegocio[];
  plantilla: TipoNegocio | undefined;
  // Sesión creada al verificar el correo; se usa en "listo" para entrar
  token: string | null;
  setToken: (t: string) => void;
  // La credencial de vista previa con lo elegido hasta ahora
  vistaPrevia: MarcaAcademia;
};

const RegistroContext = createContext<Contexto | null>(null);

export function ProveedorRegistro({ children }: { children: ReactNode }) {
  const [borrador, setBorrador] = useState<Borrador>(INICIAL);
  const [tipos, setTipos] = useState<TipoNegocio[]>([]);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    obtenerTiposNegocio()
      .then(setTipos)
      .catch(() => setTipos([]));
  }, []);

  const plantilla = tipos.find((t) => t.tipoNegocio === borrador.tipoNegocio);

  const vistaPrevia = useMemo<MarcaAcademia>(
    () => ({
      id: 'vista-previa',
      nombre: borrador.nombreAcademia.trim() || 'Tu academia',
      tipoNegocio: borrador.tipoNegocio || 'Academia',
      colorPrimario: borrador.colorPrimario,
      colorSecundario: borrador.colorSecundario,
      terminoAlumno: borrador.terminoAlumno,
      moneda: 'MXN',
      logoUrl: borrador.logo?.uri ?? null,
    }),
    [borrador],
  );

  const valor: Contexto = {
    borrador,
    actualizar: (cambios) => setBorrador((b) => ({ ...b, ...cambios })),
    tipos,
    plantilla,
    token,
    setToken,
    vistaPrevia,
  };

  return <RegistroContext.Provider value={valor}>{children}</RegistroContext.Provider>;
}

export function useRegistro() {
  const ctx = useContext(RegistroContext);
  if (!ctx) throw new Error('useRegistro debe usarse dentro de <ProveedorRegistro>');
  return ctx;
}
