import { router } from 'expo-router';
import { Mail, UserRound } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { enviarVerificacion } from '@/api/endpoints';
import { IconoCandado, IconoCandadoAbierto } from '@/components/iconos/Iconly';
import { Campo } from '@/components/ui';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro } from '@/onboarding/RegistroContexto';
import { alerta } from '@/utils/alerta';

const correoValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function PasoCuenta() {
  const { borrador, actualizar } = useRegistro();
  const [enviando, setEnviando] = useState(false);
  const refCorreo = useRef<TextInput>(null);
  const refClave = useRef<TextInput>(null);

  const valido = borrador.nombre.trim().length >= 2 && correoValido(borrador.email) && borrador.password.length >= 6;

  async function continuar() {
    setEnviando(true);
    try {
      await enviarVerificacion(borrador.email.trim());
      router.push('/registro/verificar');
    } catch (e) {
      alerta('No se pudo enviar el código', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PantallaPaso
      paso="cuenta"
      titulo="Crea tu acceso"
      descripcion="Con estos datos administrarás tu academia desde cualquier dispositivo."
      continuar={{ titulo: 'Enviar código a mi correo', onPress: continuar, deshabilitado: !valido, cargando: enviando }}
    >
      <Campo
        etiqueta="Tu nombre"
        value={borrador.nombre}
        onChangeText={(v) => actualizar({ nombre: v })}
        autoCapitalize="words"
        autoComplete="name"
        icono={UserRound}
        autoFocus
        returnKeyType="next"
        onSubmitEditing={() => refCorreo.current?.focus()}
      />
      <Campo
        ref={refCorreo}
        etiqueta="Correo"
        value={borrador.email}
        onChangeText={(v) => actualizar({ email: v })}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        icono={Mail}
        returnKeyType="next"
        onSubmitEditing={() => refClave.current?.focus()}
        error={borrador.email.length > 5 && !correoValido(borrador.email) ? 'Revisa el formato del correo' : null}
      />
      <Campo
        ref={refClave}
        etiqueta="Contraseña"
        value={borrador.password}
        onChangeText={(v) => actualizar({ password: v })}
        secureTextEntry
        autoComplete="new-password"
        icono={IconoCandado}
        iconoVisible={IconoCandadoAbierto}
        ayuda={borrador.password.length >= 6 ? 'Lista.' : `Mínimo 6 caracteres (${borrador.password.length}/6).`}
        returnKeyType="go"
        onSubmitEditing={() => valido && continuar()}
      />
    </PantallaPaso>
  );
}
