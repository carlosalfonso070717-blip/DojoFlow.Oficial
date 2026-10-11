import { useColorScheme } from 'react-native';

// Mismos colores que el frontend web (frontend/index.html :root)
const comunes = {
  primary: '#d90429',
  primaryHover: '#ef233c',
  success: '#2a9d8f',
  warning: '#e9c46a',
};

const claro = {
  ...comunes,
  background: '#f4f7f6',
  card: '#ffffff',
  border: '#e2e6ea',
  text: '#2b2d42',
  textMuted: '#8d99ae',
};

const oscuro = {
  ...comunes,
  background: '#121212',
  card: '#1a1d24',
  border: '#2a2e37',
  text: '#e8e8e8',
  textMuted: '#9aa0ac',
};

export type Tema = typeof claro;

export function useTema(): Tema {
  return useColorScheme() === 'dark' ? oscuro : claro;
}
