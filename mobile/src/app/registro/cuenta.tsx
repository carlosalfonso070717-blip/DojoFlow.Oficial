import { router } from 'expo-router';
import { Mail, UserRound } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { enviarVerificacion } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { BotonGoogle, googleDisponible } from '@/components/BotonGoogle';
import { IconoCandado, IconoCandadoAbierto } from '@/components/iconos/Iconly';
import { LogoGoogle } from '@/components/iconos/LogoGoogle';
import { Separador } from '@/components/Separador';
import { Campo, Texto } from '@/components/ui';
import { crearAcademia } from '@/onboarding/crearAcademia';
import { dejarCuentaGoogle, type CuentaGoogle } from '@/onboarding/googlePendiente';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro, type Borrador } from '@/onboarding/RegistroContexto';
import { useTema } from '@/theme';
import { alerta } from '@/utils/alerta';

const correoValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function PasoCuenta() {
  const { color, radio } = useTema();
  const { borrador, actualizar, setToken } = useRegistro();
  const { entrarConGoogle } = useSesion();
  const [enviando, setEnviando] = useState(false);
  const [creando, setCreando] = useState(false);
  const refCorreo = useRef<TextInput>(null);
  const refClave = useRef<TextInput>(null);

  const google = borrador.google;
  const nombreValido = borrador.nombre.trim().length >= 2;
  const valido = google ? nombreValido : nombreValido && correoValido(borrador.email) && borrador.password.length >= 6;

  // Con Google no hay código que verificar: la academia se crea en este paso
  async function crearConGoogle(datos: Borrador) {
    setCreando(true);
    try {
      setToken(await crearAcademia(datos));
      dejarCuentaGoogle(null);
      router.replace('/registro/listo');
    } catch (e) {
      setCreando(false);
      alerta('No se pudo crear tu academia', (e as Error).message);
    }
  }

  async function alElegirGoogle(idToken: string) {
    const r = await entrarConGoogle(idToken);
    if (r.registrado) {
      // Ya tenía cuenta con ese correo: la sesión quedó iniciada y la app lo lleva a su panel
      alerta('Ya tenías una cuenta', 'Ese correo de Google ya está registrado en GestAcademy. Te llevamos a tu academia.');
      return;
    }
    const cuenta: CuentaGoogle = { idToken, email: r.email, nombre: r.nombre };
    const datos: Borrador = { ...borrador, google: cuenta, email: r.email, nombre: borrador.nombre.trim() || r.nombre };
    actualizar(datos);
    await crearConGoogle(datos);
  }

  async function continuar() {
    if (google) {
      await crearConGoogle(borrador);
      return;
    }
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

  if (creando) {
    return (
      <View style={[estilos.cargando, { backgroundColor: color.fondo }]}>
        <ActivityIndicator size="large" color={color.marcaTexto} />
        <Texto variante="subtitulo">Creando {borrador.nombreAcademia.trim()}</Texto>
      </View>
    );
  }

  if (google) {
    return (
      <PantallaPaso
        paso="cuenta"
        titulo="Confirma tu acceso"
        descripcion="Entrarás a GestAcademy con tu cuenta de Google, sin contraseña."
        continuar={{ titulo: 'Crear mi academia', onPress: continuar, deshabilitado: !valido }}
      >
        <View style={[estilos.cuentaGoogle, { backgroundColor: color.superficie, borderColor: color.borde, borderRadius: radio.l }]}>
          <LogoGoogle size={22} />
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="pequeno" tono="tenue">
              Conectado con Google
            </Texto>
            <Texto variante="cuerpoFuerte" numberOfLines={1}>
              {google.email}
            </Texto>
          </View>
          <Pressable
            onPress={() => {
              dejarCuentaGoogle(null);
              actualizar({ google: null, email: '' });
            }}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Texto variante="detalle" style={{ fontFamily: 'Figtree_700Bold', color: color.texto, textDecorationLine: 'underline' }}>
              Cambiar
            </Texto>
          </Pressable>
        </View>
        <Campo
          etiqueta="Tu nombre"
          value={borrador.nombre}
          onChangeText={(v) => actualizar({ nombre: v })}
          autoCapitalize="words"
          autoComplete="name"
          icono={UserRound}
          returnKeyType="go"
          onSubmitEditing={() => valido && continuar()}
        />
      </PantallaPaso>
    );
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
      {googleDisponible && (
        <View style={{ gap: 14, marginTop: 10 }}>
          <Separador texto="o regístrate con" />
          <BotonGoogle onToken={alElegirGoogle} />
        </View>
      )}
    </PantallaPaso>
  );
}

const estilos = StyleSheet.create({
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  cuentaGoogle: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderWidth: StyleSheet.hairlineWidth * 2 },
});
