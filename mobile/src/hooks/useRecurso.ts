import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

// Carga datos de la API cada vez que la pantalla gana el foco (equivale a vistas[...].action en la web)
export function useRecurso<T>(cargador: () => Promise<T>, inicial: T) {
  const [datos, setDatos] = useState<T>(inicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      setDatos(await cargador());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
    // cargador siempre es una función de @/api/endpoints (estable), por eso no va en las dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar]),
  );

  return { datos, setDatos, cargando, error, recargar };
}
