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

// La app abre en oscuro por defecto: el primer cuadro ya es oscuro.
// Desplazamiento suave y barras finas que solo aparecen al pasar el mouse, como en macOS.
const estilos = `
body { background-color: #0b0c0f; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
* { scroll-behavior: smooth; -webkit-tap-highlight-color: transparent; }
div { overscroll-behavior: contain; }
* { scrollbar-width: thin; scrollbar-color: transparent transparent; }
*:hover { scrollbar-color: rgba(128,128,128,0.35) transparent; }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: transparent; border-radius: 10px; border: 3px solid transparent; background-clip: content-box; }
*:hover::-webkit-scrollbar-thumb { background-color: rgba(128,128,128,0.35); }
::selection { background: rgba(128,128,128,0.3); }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto; } }
`;
