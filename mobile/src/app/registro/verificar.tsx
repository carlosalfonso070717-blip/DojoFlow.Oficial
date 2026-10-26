import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { confirmarVerificacion, enviarVerificacion } from '@/api/endpoints';
import { Boton, Texto } from '@/components/ui';
import { CodigoVerificacion } from '@/onboarding/CodigoVerificacion';
import { crearAcademia } from '@/onboarding/crearAcademia';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro } from '@/onboarding/RegistroContexto';
import { useTema } from '@/theme';

const ESPERA_REENVIO = 30;

export default function PasoVerificar() {
  const { color } = useTema();
  const { borrador, setToken } = useRegistro();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<'codigo' | 'verificando' | 'creando'>('codigo');
  const [espera, setEspera] = useState(ESPERA_REENVIO);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  async function verificarYCrear(pin: string) {
    setError(null);
    setEtapa('verificando');
    try {
      await confirmarVerificacion(borrador.email.trim(), pin);
    } catch (e) {
      setError((e as Error).message);
      setEtapa('codigo');
      setCodigo('');
      return;
    }

    setEtapa('creando');
    try {
      const token = await crearAcademia(borrador);
      setToken(token);
      router.replace('/registro/planes');
    } catch (e) {
      setError((e as Error).message);
      setEtapa('codigo');
    }
  }

  function cambiar(v: string) {
    setCodigo(v);
    setError(null);
    if (v.length === 6) verificarYCrear(v);
  }

  async function reenviar() {
    try {
      await enviarVerificacion(borrador.email.trim());
      setEspera(ESPERA_REENVIO);
      setCodigo('');
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (etapa !== 'codigo') {
    return (
      <View style={[estilos.cargando, { backgroundColor: color.fondo }]}>
        <ActivityIndicator size="large" color={color.marcaTexto} />
        <Texto variante="subtitulo">{etapa === 'verificando' ? 'Verificando el código' : `Creando ${borrador.nombreAcademia.trim()}`}</Texto>
      </View>
    );
  }

  return (
    <PantallaPaso
      paso="verificar"
      titulo="Revisa tu correo"
      descripcion={`Enviamos un código de 6 dígitos a ${borrador.email.trim()}. Vence en 15 minutos.`}
      continuar={{ titulo: 'Verificar', onPress: () => verificarYCrear(codigo), deshabilitado: codigo.length !== 6 }}
    >
      <CodigoVerificacion valor={codigo} onCambio={cambiar} error={!!error} />
      {error && (
        <Texto variante="detalle" tono="peligro">
          {error}
        </Texto>
      )}
      <Boton
        titulo={espera > 0 ? `Reenviar código en ${espera} s` : 'Reenviar código'}
        variante="fantasma"
        tamano="compacto"
        deshabilitado={espera > 0}
        onPress={reenviar}
      />
    </PantallaPaso>
  );
}

const estilos = StyleSheet.create({
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
});
