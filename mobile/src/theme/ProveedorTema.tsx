import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSesion } from '@/auth/session';
import { crearTema, MARCA_DOJOFLOW, type Marca, type Tema } from './tema';

const TemaContext = createContext<Tema | null>(null);

// El tema se recalcula cuando cambia la academia (colores en Ajustes) o el modo claro/oscuro.
// `marca` permite forzar una identidad, p. ej. el kiosco, que no tiene sesión de coach.
export function ProveedorTema({ children, marca }: { children: ReactNode; marca?: Marca | null }) {
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { perfil } = useSesion();
  const primario = marca?.primario ?? perfil?.academia.colorPrimario ?? MARCA_DOJOFLOW.primario;
  const secundario = marca?.secundario ?? perfil?.academia.colorSecundario ?? MARCA_DOJOFLOW.secundario;

  const tema = useMemo(() => crearTema({ primario, secundario }, esquema), [primario, secundario, esquema]);

  return <TemaContext.Provider value={tema}>{children}</TemaContext.Provider>;
}

export function useTema(): Tema {
  const tema = useContext(TemaContext);
  if (!tema) throw new Error('useTema debe usarse dentro de <ProveedorTema>');
  return tema;
}
