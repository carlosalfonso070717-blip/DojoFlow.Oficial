import { useSyncExternalStore } from 'react';
import { almacen } from '@/auth/almacen';

// Modo de color elegido por la persona: seguir al sistema o forzar claro/oscuro.
// Es global (no depende de qué ProveedorTema lo lea) y se recuerda en el dispositivo.
// Sin elección guardada la app abre en oscuro: ahí luce el diseño (cristal y brillo de la marca).
export type PreferenciaTema = 'sistema' | 'claro' | 'oscuro';

const LLAVE = 'preferenciaTema';
let actual: PreferenciaTema = 'oscuro';
const oyentes = new Set<() => void>();

almacen
  .leer(LLAVE)
  .then((guardada) => {
    if (guardada === 'sistema' || guardada === 'claro' || guardada === 'oscuro') cambiarPreferenciaTema(guardada, false);
  })
  .catch(() => {});

export function cambiarPreferenciaTema(nueva: PreferenciaTema, guardar = true) {
  actual = nueva;
  oyentes.forEach((f) => f());
  // También se guarda "sistema": sin nada guardado se usaría el oscuro por defecto
  if (guardar) almacen.guardar(LLAVE, nueva).catch(() => {});
}

function suscribir(f: () => void) {
  oyentes.add(f);
  return () => oyentes.delete(f);
}

export function usePreferenciaTema(): PreferenciaTema {
  return useSyncExternalStore(suscribir, () => actual, () => actual);
}
