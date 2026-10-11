import { router } from 'expo-router';
import { School } from 'lucide-react-native';
import { Campo } from '@/components/ui';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro } from '@/onboarding/RegistroContexto';

export default function PasoNombre() {
  const { borrador, actualizar } = useRegistro();
  const valido = borrador.nombreAcademia.trim().length >= 2;

  return (
    <PantallaPaso
      paso="index"
      titulo="¿Cómo se llama tu academia?"
      descripcion="Así la verán tus alumnos al registrar su asistencia y en sus recibos."
      continuar={{ onPress: () => router.push('/registro/tipo'), deshabilitado: !valido }}
    >
      <Campo
        etiqueta="Nombre de la academia"
        value={borrador.nombreAcademia}
        onChangeText={(v) => actualizar({ nombreAcademia: v })}
        placeholder="Ej. Escuela de Ballet Swan"
        autoCapitalize="words"
        icono={School}
        autoFocus
        returnKeyType="next"
        onSubmitEditing={() => valido && router.push('/registro/tipo')}
        maxLength={120}
      />
    </PantallaPaso>
  );
}
