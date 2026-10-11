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
