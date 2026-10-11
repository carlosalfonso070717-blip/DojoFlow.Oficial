import { router } from 'expo-router';
import {
  Dumbbell,
  Languages,
  Music,
  Palette,
  Shapes,
  Sparkles,
  Swords,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { Presionable, Texto } from '@/components/ui';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro } from '@/onboarding/RegistroContexto';
import { useTema } from '@/theme';

const ICONOS: Record<string, LucideIcon> = {
  'Artes marciales': Swords,
  Danza: Sparkles,
  Música: Music,
  Deportes: Trophy,
  Fitness: Dumbbell,
  Arte: Palette,
  Idiomas: Languages,
  Otro: Shapes,
};

export default function PasoTipo() {
  const { color, radio } = useTema();
  const { borrador, actualizar, tipos } = useRegistro();

  function elegir(tipo: string) {
    const plantilla = tipos.find((t) => t.tipoNegocio === tipo);
    if (!plantilla) return;
    // Al cambiar de giro se proponen sus colores, su término y sus clases típicas
    actualizar({
      tipoNegocio: tipo,
      colorPrimario: plantilla.colorPrimario,
      colorSecundario: plantilla.colorSecundario,
      terminoAlumno: plantilla.terminoAlumno,
      clases: plantilla.clasesSugeridas.map((nombre) => ({ nombre, precio: '' })),
    });
  }

  return (
    <PantallaPaso
      paso="tipo"
      titulo="¿Qué enseñan?"
      descripcion="Te propondremos colores y clases de inicio. Todo se puede cambiar después."
      continuar={{ onPress: () => router.push('/registro/alumnos'), deshabilitado: !borrador.tipoNegocio }}
    >
      <View style={estilos.rejilla}>
        {tipos.map((t) => {
          const activo = borrador.tipoNegocio === t.tipoNegocio;
          const Icono = ICONOS[t.tipoNegocio] ?? Shapes;
          return (
            <Presionable
              key={t.tipoNegocio}
              onPress={() => elegir(t.tipoNegocio)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={t.tipoNegocio}
              style={[
                estilos.tarjeta,
                {
                  borderRadius: radio.l,
                  backgroundColor: activo ? color.marcaSuave : color.superficie,
                  borderColor: activo ? t.colorPrimario : color.borde,
                  borderWidth: activo ? 2 : StyleSheet.hairlineWidth * 2,
                },
              ]}
            >
              <View style={[estilos.icono, { backgroundColor: t.colorPrimario }]}>
                <Icono size={22} color="#ffffff" strokeWidth={2.2} />
              </View>
              <Texto variante="cuerpoFuerte">{t.tipoNegocio}</Texto>
              <Texto variante="pequeno" tono="tenue" numberOfLines={1}>
                {t.clasesSugeridas.length ? t.clasesSugeridas.slice(0, 3).join(', ') : 'Tú defines tus clases'}
              </Texto>
            </Presionable>
          );
        })}
      </View>
    </PantallaPaso>
  );
}

const estilos = StyleSheet.create({
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tarjeta: { width: '48%', flexGrow: 1, padding: 14, gap: 6 },
  icono: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
});
