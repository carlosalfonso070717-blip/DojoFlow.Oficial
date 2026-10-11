import { router } from 'expo-router';
import { Credencial, DatoCredencial } from '@/components/ui';
import { SelectorColores } from '@/components/SelectorColores';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro } from '@/onboarding/RegistroContexto';
import { plural } from '@/utils/texto';

export default function PasoColores() {
  const { borrador, actualizar, vistaPrevia, plantilla } = useRegistro();

  return (
    <PantallaPaso
      paso="colores"
      titulo="Elige tus colores"
      descripcion="El principal pinta botones y detalles; el de fondo, la credencial de tu academia."
      continuar={{ onPress: () => router.push('/registro/logo') }}
      cabecera={
        <Credencial academia={vistaPrevia}>
          <DatoCredencial valor="24" etiqueta={plural(borrador.terminoAlumno)} fondo={borrador.colorSecundario} />
          <DatoCredencial valor="$18.5k" etiqueta="Ingresos del mes" fondo={borrador.colorSecundario} />
        </Credencial>
      }
    >
      <SelectorColores
        primario={borrador.colorPrimario}
        secundario={borrador.colorSecundario}
        onPrimario={(c) => actualizar({ colorPrimario: c })}
        onSecundario={(c) => actualizar({ colorSecundario: c })}
        sugerido={plantilla ? { primario: plantilla.colorPrimario, secundario: plantilla.colorSecundario } : undefined}
      />
    </PantallaPaso>
  );
}
