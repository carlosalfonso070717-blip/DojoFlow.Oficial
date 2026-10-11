import { router, usePathname, type Href } from 'expo-router';
import { ChevronRight, Moon, Package, Plus, Search, Sun, Tablet, Users } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type MouseEvent } from 'react';
import { obtenerAlertasInventario, obtenerMensualidades } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { cambiarPreferenciaTema, useTema } from '@/theme';
import { useTour, type IdObjetivo } from '@/tour/Tour';
import { alerta } from '@/utils/alerta';
import { plural } from '@/utils/texto';
import { urlAbsoluta } from './Elementos';
import { IconoAjustes, IconoCerrarSesion, IconoFinanzas, IconoInicio, IconoPagos, type PropsIcono } from './iconos/Iconly';
import { confirmar } from './ui';

// Barra lateral de la web de escritorio: contraída muestra solo íconos; al pasar el mouse
// (o al enfocarla con teclado) se expande sobre el contenido con textos, buscador y acciones.
// Es HTML y CSS reales (react-native-web corre sobre react-dom): las transiciones las hace el navegador.
export const ANCHO_BARRA_LATERAL = 84;

type Seccion = { ruta: Href; etiqueta: string; icono: ComponentType<PropsIcono>; activa: (p: string) => boolean; insignia?: number };

export function BarraLateral() {
  const { color, oscuro } = useTema();
  const { perfil, cerrarSesion, vincularKiosco } = useSesion();
  const pathname = usePathname();
  const [busqueda, setBusqueda] = useState('');
  const [avisos, setAvisos] = useState({ vencidos: 0, stock: 0 });
  const refNav = useObjetivoDom('barra');
  const refAjustes = useObjetivoDom<HTMLButtonElement>('ajustes');

  // Contadores de las insignias: se actualizan al cambiar de sección (p. ej. tras cobrar un recibo)
  useEffect(() => {
    let vigente = true;
    Promise.all([obtenerMensualidades(), obtenerAlertasInventario()])
      .then(([recibos, alertas]) => {
        if (vigente) setAvisos({ vencidos: recibos.filter((r) => r.estado === 'Vencido').length, stock: alertas.length });
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [pathname]);

  if (!perfil) return null;
  const { usuario, academia } = perfil;
  const termino = academia.terminoAlumno || 'Alumno';

  const principales: Seccion[] = [
    { ruta: '/', etiqueta: 'Inicio', icono: IconoInicio, activa: (p) => p === '/' },
    { ruta: '/alumnos', etiqueta: plural(termino), icono: Users, activa: (p) => p.startsWith('/alumnos') },
    { ruta: '/mensualidades', etiqueta: 'Cobros', icono: IconoPagos, activa: (p) => p.startsWith('/mensualidades'), insignia: avisos.vencidos },
    { ruta: '/inventario', etiqueta: 'Inventario', icono: Package, activa: (p) => p.startsWith('/inventario'), insignia: avisos.stock },
  ];
  const secundarias: Seccion[] = [
    { ruta: '/finanzas', etiqueta: 'Finanzas', icono: IconoFinanzas, activa: (p) => p.startsWith('/finanzas') },
  ];

  // Clic normal: navegación de la app. Ctrl/Cmd o botón central: el navegador abre otra pestaña.
  function navegar(e: MouseEvent<HTMLAnchorElement>, ruta: Href) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    // Sin el foco, la barra se contrae al quitar el mouse
    e.currentTarget.blur();
    router.navigate(ruta);
  }

  function buscar() {
    const q = busqueda.trim();
    router.navigate({ pathname: '/alumnos', params: q ? { q } : {} });
    setBusqueda('');
    (document.activeElement as HTMLElement | null)?.blur();
  }

  async function abrirKiosco() {
    try {
      await vincularKiosco();
      router.push('/kiosco');
    } catch (e) {
      alerta('No se pudo abrir el kiosco', (e as Error).message);
    }
  }

  const variables = {
    '--lb-fondo': color.superficie,
    '--lb-borde': color.borde,
    '--lb-texto': color.texto,
    '--lb-suave': color.textoSuave,
    '--lb-tenue': color.textoTenue,
    '--lb-hover': color.fondo,
    '--lb-activo': color.marcaSuave,
    '--lb-activo-texto': color.marcaTexto,
    '--lb-marca': color.marca,
    '--lb-sobre-marca': color.sobreMarca,
    '--lb-campo': color.fondo,
    '--lb-sombra': oscuro ? 'rgba(0,0,0,0.55)' : 'rgba(16,18,24,0.14)',
  } as CSSProperties;

  const item = (s: Seccion) => {
    const activa = s.activa(pathname);
    const Icono = s.icono;
    return (
      <a
        key={s.etiqueta}
        href={typeof s.ruta === 'string' ? s.ruta : '/'}
        className={`lb-item${activa ? ' activa' : ''}`}
        aria-current={activa ? 'page' : undefined}
        title={s.etiqueta}
        onClick={(e) => navegar(e, s.ruta)}
      >
        <span className="lb-icono">
          <Icono size={22} color="currentColor" strokeWidth={activa ? 2 : 1.6} />
        </span>
        <span className="lb-texto">{s.etiqueta}</span>
        {!!s.insignia && (
          <span className="lb-insignia" aria-label={`${s.insignia} pendientes`}>
            {s.insignia > 99 ? '99+' : s.insignia}
          </span>
        )}
      </a>
    );
  };

  return (
    <div className="lb-hueco" style={variables}>
      <style>{CSS}</style>
      <aside className="lb" aria-label="Navegación principal">
        <a href="/ajustes" className="lb-perfil" title="Tu cuenta" onClick={(e) => navegar(e, '/ajustes')}>
          {usuario.fotoUrl ? (
            <img className="lb-avatar" src={urlAbsoluta(usuario.fotoUrl)} alt="" />
          ) : (
            <span className="lb-avatar lb-iniciales">{iniciales(usuario.nombre)}</span>
          )}
          <span className="lb-detalles">
            <span className="lb-nombre">{usuario.nombre}</span>
            <span className="lb-rol">{usuario.rol === 'Dueno' ? 'Dueño' : 'Coach'} · {academia.nombre}</span>
          </span>
          <span className="lb-chevron">
            <ChevronRight size={18} color="currentColor" />
          </span>
        </a>

        <form
          className="lb-buscar"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            buscar();
          }}
        >
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={`Buscar ${termino.toLowerCase()} o PIN`}
            aria-label={`Buscar ${termino.toLowerCase()}`}
          />
          <span className="lb-lupa" aria-hidden="true">
            <Search size={20} color="currentColor" />
          </span>
        </form>

        <nav ref={refNav} className="lb-nav">
          {principales.map(item)}
          <hr />
          {secundarias.map(item)}
          <button type="button" className="lb-item" title="Abrir kiosco" onClick={abrirKiosco}>
            <span className="lb-icono">
              <Tablet size={22} color="currentColor" strokeWidth={1.6} />
            </span>
            <span className="lb-texto">Abrir kiosco</span>
          </button>
        </nav>

        <div className="lb-acciones">
          <button
            type="button"
            className="lb-accion lb-tema"
            title={oscuro ? 'Modo claro' : 'Modo oscuro'}
            aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            onClick={() => cambiarPreferenciaTema(oscuro ? 'claro' : 'oscuro')}
          >
            <span className={`lb-luna${oscuro ? '' : ' visible'}`}>
              <Moon size={20} color="currentColor" />
            </span>
            <span className={`lb-sol${oscuro ? ' visible' : ''}`}>
              <Sun size={20} color="currentColor" />
            </span>
          </button>
          <button
            ref={refAjustes}
            type="button"
            className={`lb-accion${pathname.startsWith('/ajustes') ? ' activa' : ''}`}
            title="Ajustes"
            aria-label="Ajustes"
            aria-current={pathname.startsWith('/ajustes') ? 'page' : undefined}
            onClick={() => router.navigate('/ajustes')}
          >
            <IconoAjustes size={20} color="currentColor" />
          </button>
          <button
            type="button"
            className="lb-accion lb-destacada"
            title={`Inscribir ${termino.toLowerCase()}`}
            aria-label={`Inscribir ${termino.toLowerCase()}`}
            onClick={() => router.push('/registrar')}
          >
            <Plus size={20} color="currentColor" />
          </button>
          <button
            type="button"
            className="lb-accion lb-salir"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            onClick={() => confirmar('¿Cerrar sesión?', undefined, 'Cerrar sesión', () => cerrarSesion())}
          >
            <IconoCerrarSesion size={20} color="currentColor" />
          </button>
        </div>
      </aside>
    </div>
  );
}

const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

// Registra un elemento del DOM como paso del tour (el tour mide con measureInWindow, como en nativo)
function useObjetivoDom<T extends HTMLElement>(id: IdObjetivo) {
  const { registrar } = useTour();
  const ref = useRef<T>(null);
  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    registrar(id, {
      measureInWindow: (cb) => {
        const r = nodo.getBoundingClientRect();
        cb(r.left, r.top, r.width, r.height);
      },
    });
    return () => registrar(id, null);
  }, [id, registrar]);
  return ref;
}

const CSS = `
.lb-hueco { position: relative; width: ${ANCHO_BARRA_LATERAL}px; flex: none; height: 100%; z-index: 20; }
.lb {
  position: absolute; inset: 0 auto 0 0; width: ${ANCHO_BARRA_LATERAL}px; box-sizing: border-box;
  display: flex; flex-direction: column; gap: 14px; padding: 18px 12px;
  background: var(--lb-fondo); border-right: 1px solid var(--lb-borde); color: var(--lb-texto);
  font-family: Figtree_500Medium, system-ui, sans-serif; font-size: 15px;
  overflow: hidden; transition: width .32s cubic-bezier(.4,0,.2,1), box-shadow .32s ease;
}
.lb:hover, .lb:has(:focus-visible), .lb:has(input:focus) { width: 264px; box-shadow: 12px 0 40px -12px var(--lb-sombra); }

.lb a, .lb button { color: inherit; text-decoration: none; font: inherit; background: none; border: 0; cursor: pointer; }
.lb :focus-visible { outline: 2px solid var(--lb-marca); outline-offset: 2px; }

/* Perfil */
.lb-perfil { display: flex; align-items: center; gap: 12px; padding: 6px 8px; border-radius: 16px; min-height: 56px; box-sizing: border-box; transition: background .2s; }
.lb-perfil:hover { background: var(--lb-hover); }
.lb-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex: none; }
.lb-iniciales { display: grid; place-items: center; background: var(--lb-activo); color: var(--lb-activo-texto); font-family: Figtree_700Bold, sans-serif; font-size: 16px; }
.lb-detalles { display: grid; min-width: 0; flex: 1; }
.lb-nombre { font-family: Figtree_700Bold, sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lb-rol { font-size: 13px; color: var(--lb-suave); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lb-chevron { display: flex; color: var(--lb-tenue); }

/* Textos que aparecen al expandir */
.lb-detalles, .lb-chevron, .lb-texto, .lb-buscar input { opacity: 0; transition: opacity .18s ease; }
.lb:hover :is(.lb-detalles, .lb-chevron, .lb-texto, .lb-buscar input),
.lb:has(:focus-visible) :is(.lb-detalles, .lb-chevron, .lb-texto, .lb-buscar input),
.lb:has(input:focus) :is(.lb-detalles, .lb-chevron, .lb-texto, .lb-buscar input) { opacity: 1; transition-delay: .1s; }

/* Buscador: contraído es solo la lupa */
.lb-buscar { position: relative; height: 44px; flex: none; }
.lb-buscar input {
  width: 100%; height: 100%; box-sizing: border-box; padding: 0 12px 0 46px; border-radius: 14px;
  border: 1px solid var(--lb-borde); background: var(--lb-campo); color: var(--lb-texto);
  font: 15px Figtree_400Regular, sans-serif; outline: none; cursor: pointer;
}
.lb-buscar input:focus { border-color: var(--lb-marca); cursor: text; }
.lb-buscar input::placeholder { color: var(--lb-tenue); }
.lb-buscar input::-webkit-search-cancel-button { display: none; }
.lb-lupa { position: absolute; left: 19px; top: 12px; display: flex; color: var(--lb-suave); pointer-events: none; }

/* Navegación */
.lb-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; }
.lb-nav hr { border: 0; height: 1px; background: var(--lb-borde); margin: 8px 6px; flex: none; }
.lb-item {
  position: relative; display: flex; align-items: center; gap: 14px; height: 46px; flex: none;
  padding: 0 0 0 19px; border-radius: 14px; color: var(--lb-suave) !important; text-align: left; white-space: nowrap;
  transition: color .2s;
}
.lb-item::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; background: var(--lb-hover);
  opacity: 0; transform: scale(.92); transition: opacity .22s ease, transform .22s ease, background .22s ease;
}
.lb-item:hover { color: var(--lb-texto) !important; }
.lb-item:hover::before { opacity: 1; transform: scale(1); }
.lb-item.activa { color: var(--lb-activo-texto) !important; font-family: Figtree_700Bold, sans-serif; }
.lb-item.activa::before { background: var(--lb-activo); opacity: 1; transform: scale(1); }
.lb-icono, .lb-texto { position: relative; display: flex; }
.lb-icono { flex: none; }

/* Insignia: sobre el ícono al estar contraída, a la derecha al expandirse */
.lb-insignia {
  position: absolute; top: 5px; left: 36px; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box;
  border-radius: 9px; background: var(--lb-marca); color: var(--lb-sobre-marca); border: 2px solid var(--lb-fondo);
  font: 11px/14px Figtree_700Bold, sans-serif; text-align: center;
  transition: left .32s cubic-bezier(.4,0,.2,1), top .32s cubic-bezier(.4,0,.2,1), height .2s, font-size .2s;
}
.lb:hover .lb-insignia, .lb:has(:focus-visible) .lb-insignia, .lb:has(input:focus) .lb-insignia {
  left: calc(100% - 40px); top: 12px; height: 22px; border-radius: 11px; font-size: 12px; line-height: 18px;
}

/* Acciones: la rejilla pasa sola de columna (contraída) a fila (expandida) mientras cambia el ancho */
.lb-acciones { display: grid; grid-template-columns: repeat(auto-fill, 44px); justify-content: space-between; gap: 8px; padding: 0 8px; flex: none; }
.lb-accion {
  position: relative; width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center;
  color: var(--lb-suave) !important; transition: background .2s, color .2s;
}
.lb-accion:hover { background: var(--lb-hover); color: var(--lb-texto) !important; }
.lb-accion.activa { background: var(--lb-activo); color: var(--lb-activo-texto) !important; }
.lb-destacada { background: var(--lb-marca) !important; color: var(--lb-sobre-marca) !important; }
.lb-destacada:hover { filter: brightness(1.08); }
.lb-tema > span { position: absolute; display: flex; opacity: 0; transform: rotate(-90deg) scale(.6); transition: opacity .25s, transform .35s cubic-bezier(.4,0,.2,1); }
.lb-tema > span.visible { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) { .lb, .lb * { transition: none !important; } }
`;
