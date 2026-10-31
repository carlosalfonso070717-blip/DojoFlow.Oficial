import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

// Cuánto tarda una cifra en llegar de su valor anterior al nuevo
const DURACION = 750;

type Cifra = { valor: number; formatear: (v: number) => string };

// Encuentra la primera cantidad dentro de un texto ya formateado ("$58,900.00", "$4.3k", "8 pz", "+12%")
// y devuelve su valor y cómo volver a escribir el texto con otro valor, con el mismo formato.
export function analizarCifra(texto: string): Cifra | null {
  const m = /\d[\d,]*(?:\.\d+)?/.exec(texto);
  if (!m) return null;
  const crudo = m[0];
  const antes = texto.slice(0, m.index);
  const despues = texto.slice(m.index + crudo.length);
  const decimales = crudo.includes('.') ? crudo.split('.')[1].length : 0;
  const agrupa = crudo.includes(',');
  // "$4.3k": la cifra real son miles, así se compara bien con "$980"
  const factor = /^k\b/i.test(despues) ? 1000 : 1;
  const valor = parseFloat(crudo.replace(/,/g, '')) * factor;
  return {
    valor,
    formatear: (v) =>
      antes +
      (v / factor).toLocaleString('en-US', { minimumFractionDigits: decimales, maximumFractionDigits: decimales, useGrouping: agrupa }) +
      despues,
  };
}

// Cuando el texto cambia de una cifra a otra, la cifra cuenta de una a la otra con desaceleración
// en lugar de saltar. Con `desdeCero`, al aparecer cuenta desde 0 (p. ej. cuando llegan los datos
// tras el esqueleto de carga); si no, la primera vez se muestra tal cual. Con "reducir movimiento" no se anima.
export function useCifraAnimada(texto: string, activa = true, desdeCero = false): string {
  const reducir = useReducedMotion();
  const [previo, setPrevio] = useState(() => (activa && desdeCero ? (analizarCifra(texto)?.formatear(0) ?? texto) : texto));
  const [tramo, setTramo] = useState<{ desde: number; hasta: number } | null>(null);
  const [valor, setValor] = useState(0);

  // El tramo se decide durante el render: así nunca se ve un cuadro con la cifra nueva antes de animarla
  if (texto !== previo) {
    setPrevio(texto);
    const destino = analizarCifra(texto);
    // Si cambia a media animación, sigue desde donde iba
    const desde = tramo ? valor : analizarCifra(previo)?.valor;
    if (activa && !reducir && destino && desde !== undefined && desde !== destino.valor) {
      setTramo({ desde, hasta: destino.valor });
      setValor(desde);
    } else {
      setTramo(null);
    }
  }

  useEffect(() => {
    if (!tramo) return;
    const inicio = Date.now();
    let cuadro = 0;
    const paso = () => {
      const p = Math.min(1, (Date.now() - inicio) / DURACION);
      if (p >= 1) {
        setTramo(null);
        return;
      }
      const suave = 1 - (1 - p) ** 3;
      setValor(tramo.desde + (tramo.hasta - tramo.desde) * suave);
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [tramo]);

  if (!tramo) return texto;
  return analizarCifra(texto)?.formatear(valor) ?? texto;
}
