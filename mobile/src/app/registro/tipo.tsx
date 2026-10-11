import { router } from 'expo-router';
import {
  Check,
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
                  backgroundColor: color.superficie,
                  borderColor: activo ? color.texto : color.borde,
                  borderWidth: activo ? 2 : StyleSheet.hairlineWidth * 2,
                },
              ]}
            >
              <View style={estilos.cabecera}>
                <View style={[estilos.icono, { backgroundColor: activo ? color.marca : color.fondo }]}>
                  <Icono size={22} color={activo ? color.sobreMarca : color.texto} strokeWidth={1.8} />
                </View>
                {activo && <Check size={18} color={color.texto} strokeWidth={2.6} />}
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
  tarjeta: { width: '47%', flexGrow: 1, padding: 16, gap: 4 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  icono: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
