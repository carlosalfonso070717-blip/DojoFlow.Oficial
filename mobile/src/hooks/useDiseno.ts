import { Platform, useWindowDimensions } from 'react-native';

// A partir de este ancho la web usa la barra lateral en lugar de la barra inferior
export const ANCHO_ESCRITORIO = 1024;

// Medidas responsivas compartidas: el contenido nunca se estira más allá de una lectura cómoda
export function useDiseno() {
  const { width, height } = useWindowDimensions();
  const esTableta = width >= 768;
  const horizontal = width > height;
  const esEscritorio = Platform.OS === 'web' && width >= ANCHO_ESCRITORIO;
  return {
    esEscritorio,
    ancho: width,
    esTableta,
    horizontal,
    // Margen lateral: más aire en pantallas grandes
    margen: esEscritorio ? 40 : esTableta ? 32 : width < 360 ? 16 : 20,
    // Ancho máximo del contenido de listas y formularios
    // En escritorio las pantallas ocupan todo el ancho disponible (solo con su margen lateral)
    maximo: esEscritorio ? width : esTableta ? 720 : 560,
    // Ancho máximo de las secciones principales en escritorio (rejillas de tarjetas)
    maximoEscritorio: width,
    // Ancho máximo de las secciones con lista (Alumnos, Cobros, Inventario, Finanzas)
    anchoSeccion: esEscritorio ? width : esTableta ? 720 : 560,
    // Aire arriba del título de cada sección (se suma al área segura del celular)
    arriba: esEscritorio ? 36 : 14,
    // Columnas de tarjetas para las listas: 1 en celular, más en escritorio según el espacio
    columnas: esEscritorio ? (width >= 1700 ? 4 : width >= 1280 ? 3 : 2) : 1,
  };
}
