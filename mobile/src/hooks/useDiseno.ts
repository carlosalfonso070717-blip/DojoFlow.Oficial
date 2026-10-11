import { useWindowDimensions } from 'react-native';

// Medidas responsivas compartidas: el contenido nunca se estira más allá de una lectura cómoda
export function useDiseno() {
  const { width, height } = useWindowDimensions();
  const esTableta = width >= 768;
  const horizontal = width > height;
  return {
    ancho: width,
    esTableta,
    horizontal,
    // Margen lateral: más aire en pantallas grandes
    margen: esTableta ? 32 : width < 360 ? 16 : 20,
    // Ancho máximo del contenido de listas y formularios
    maximo: esTableta ? 720 : 560,
  };
}
