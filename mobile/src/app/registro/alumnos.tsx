import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Campo, Chip, Superficie, Texto } from '@/components/ui';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro } from '@/onboarding/RegistroContexto';
import { plural } from '@/utils/texto';

const COMUNES = ['Alumno', 'Estudiante', 'Miembro', 'Atleta'];
const POR_TIPO: Record<string, string[]> = {
  'Artes marciales': ['Peleador', 'Practicante'],
  Danza: ['Bailarina', 'Bailarín'],
  Música: ['Músico'],
  Deportes: ['Jugador'],
  Fitness: ['Socio'],
};

export default function PasoAlumnos() {
  const { borrador, actualizar } = useRegistro();
  const opciones = useMemo(
    () => [...new Set([borrador.terminoAlumno, ...(POR_TIPO[borrador.tipoNegocio] ?? []), ...COMUNES])].filter(Boolean),
    // Las opciones dependen solo del giro: así no se reordenan al elegir una
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [borrador.tipoNegocio],
  );
  const [otro, setOtro] = useState(opciones.includes(borrador.terminoAlumno) ? '' : borrador.terminoAlumno);
  const termino = borrador.terminoAlumno.trim();

  return (
    <PantallaPaso
      paso="alumnos"
      titulo="¿Cómo les dices a tus alumnos?"
      descripcion="Usaremos esta palabra en toda la app."
      continuar={{ onPress: () => router.push('/registro/colores'), deshabilitado: termino.length < 2 }}
    >
      <View style={estilos.chips}>
        {opciones.map((o) => (
          <Chip
            key={o}
            texto={plural(o)}
            activo={termino === o && !otro}
            onPress={() => {
              setOtro('');
              actualizar({ terminoAlumno: o });
            }}
          />
        ))}
      </View>

      <Campo
        etiqueta="Otra palabra"
        placeholder="En singular, ej. Guerrero"
        value={otro}
        onChangeText={(v) => {
          setOtro(v);
          actualizar({ terminoAlumno: v.trim() ? v.trim()[0].toUpperCase() + v.trim().slice(1) : opciones[0] });
        }}
        autoCapitalize="words"
        maxLength={40}
      />

      {termino.length >= 2 && (
        <Superficie style={{ gap: 4 }}>
          <Texto variante="pequeno" tono="tenue">
            Así se verá
          </Texto>
          <Texto variante="cuerpoFuerte">12 {plural(termino).toLowerCase()}</Texto>
          <Texto variante="cuerpo" tono="marca">
            Inscribir {termino.toLowerCase()}
          </Texto>
        </Superficie>
      )}
    </PantallaPaso>
  );
}

const estilos = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
