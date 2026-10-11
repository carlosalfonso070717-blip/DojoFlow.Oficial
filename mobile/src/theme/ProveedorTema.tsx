import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSesion } from '@/auth/session';
import { crearTema, type Marca, type Tema } from './tema';

const TemaContext = createContext<Tema | null>(null);

// El tema se recalcula cuando cambia la academia (colores en Ajustes) o el modo claro/oscuro.
// `marca` permite forzar una identidad (el kiosco, que no tiene sesión de coach);
// `neutro` fuerza el tema sin color (login y registro). Sin academia, el tema es neutro.
export function ProveedorTema({ children, marca, neutro }: { children: ReactNode; marca?: Marca | null; neutro?: boolean }) {
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { perfil } = useSesion();
  const primario = neutro ? undefined : (marca?.primario ?? perfil?.academia.colorPrimario);
  const secundario = neutro ? undefined : (marca?.secundario ?? perfil?.academia.colorSecundario);

  const tema = useMemo(
    () => crearTema(primario && secundario ? { primario, secundario } : null, esquema),
    [primario, secundario, esquema],
  );

  return <TemaContext.Provider value={tema}>{children}</TemaContext.Provider>;
}

export function useTema(): Tema {
  const tema = useContext(TemaContext);
  if (!tema) throw new Error('useTema debe usarse dentro de <ProveedorTema>');
  return tema;
}
