import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { obtenerTiposNegocio, type MarcaAcademia, type TipoNegocio } from '@/api/endpoints';
import type { ArchivoLogo } from '@/utils/logo';
import { cuentaGooglePendiente, type CuentaGoogle } from './googlePendiente';

export type ClaseBorrador = { nombre: string; precio: string };

export type SucursalBorrador = { nombre: string; direccion: string; telefono: string };

export type Borrador = {
  nombreAcademia: string;
  tipoNegocio: string;
  terminoAlumno: string;
  colorPrimario: string;
  colorSecundario: string;
  logo: ArchivoLogo | null;
  clases: ClaseBorrador[];
  // Negocios con varias sedes: el nombre de esta (la principal) y los datos de las demás
  variasSucursales: boolean;
  nombreSucursal: string;
  sucursales: SucursalBorrador[];
  nombre: string;
  email: string;
  password: string;
  // Si eligió Google: se crea la cuenta con su token, sin contraseña ni código por correo
  google: CuentaGoogle | null;
};

const INICIAL: Borrador = {
  nombreAcademia: '',
  tipoNegocio: '',
  terminoAlumno: 'Alumno',
  colorPrimario: '#d90429',
  colorSecundario: '#14161a',
  logo: null,
  clases: [],
  variasSucursales: false,
  nombreSucursal: '',
  sucursales: [],
  nombre: '',
  email: '',
  password: '',
  google: null,
};

// Orden de las pantallas del asistente; la barra de progreso se calcula con esto
export const PASOS = ['index', 'tipo', 'alumnos', 'colores', 'logo', 'clases', 'sucursales', 'cuenta', 'verificar'] as const;
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
  // Si viene del login con una cuenta de Google nueva, ya trae nombre y correo
  const [borrador, setBorrador] = useState<Borrador>(() => {
    const google = cuentaGooglePendiente();
    return google ? { ...INICIAL, google, nombre: google.nombre, email: google.email } : INICIAL;
  });
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
      asistenciasActivas: false,
      sucursalesActivas: borrador.variasSucursales,
      nombreSucursal: borrador.variasSucursales ? borrador.nombreSucursal.trim() || null : null,
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
