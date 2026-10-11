// "Alumno" → "Alumnos", "Atleta" → "Atletas", "Miembro" → "Miembros"
export function plural(palabra: string): string {
  if (!palabra) return palabra;
  return /[aeiouáéíóú]$/i.test(palabra) ? `${palabra}s` : `${palabra}es`;
}

export function cantidad(n: number, singular: string, enPlural = plural(singular)): string {
  return `${n} ${n === 1 ? singular : enPlural}`;
}

export function saludo(fecha = new Date()): string {
  const hora = fecha.getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "15/10/2026" → "15 oct" (o "15 oct 2025" si no es del año en curso)
export function fechaCorta(ddmmyyyy: string, hoy = new Date()): string {
  const [d, m, a] = ddmmyyyy.split('/').map(Number);
  if (!d || !m || !a) return ddmmyyyy;
  const base = `${d} ${MESES_CORTOS[m - 1]}`;
  return a === hoy.getFullYear() ? base : `${base} ${a}`;
}
