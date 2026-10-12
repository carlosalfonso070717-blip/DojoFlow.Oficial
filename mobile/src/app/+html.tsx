import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Documento HTML de la versión web (solo se usa al compilar para navegador)
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="description" content="GestAcademy: alumnos, cobros, inventario y finanzas de tu academia en un solo lugar." />
        <meta name="theme-color" content="#151619" />
        <meta property="og:title" content="GestAcademy" />
        <meta property="og:description" content="Gestión para academias de artes marciales, danza, música y más." />
        <ScrollViewStyleReset />
        {/* Fondo correcto desde el primer cuadro, antes de que cargue la app (evita el destello blanco en modo oscuro) */}
        <style dangerouslySetInnerHTML={{ __html: estilos }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const estilos = `
body { background-color: #f5f5f6; }
@media (prefers-color-scheme: dark) { body { background-color: #0e0f12; } }
`;
