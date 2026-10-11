import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ImagePlus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Boton, Presionable, Texto } from '@/components/ui';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro } from '@/onboarding/RegistroContexto';
import { useTema } from '@/theme';
import { elegirLogo } from '@/utils/logo';
import { alerta } from '@/utils/alerta';

export default function PasoLogo() {
  const { color } = useTema();
  const { borrador, actualizar } = useRegistro();
  const [cargando, setCargando] = useState(false);

  async function elegir() {
    setCargando(true);
    try {
      const logo = await elegirLogo();
      if (logo) actualizar({ logo });
    } catch (e) {
      alerta('No se pudo usar esa imagen', (e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  const siguiente = () => router.push('/registro/clases');

  return (
    <PantallaPaso
      paso="logo"
      titulo="Sube tu logo"
      descripcion="Aparece en la credencial, en el kiosco y en tu perfil. Funciona mejor una imagen cuadrada."
      continuar={{ onPress: siguiente, titulo: borrador.logo ? 'Continuar' : 'Elegir de mi galería', ...(borrador.logo ? {} : { onPress: elegir, cargando }) }}
      secundaria={borrador.logo ? undefined : { titulo: 'Omitir por ahora', onPress: siguiente }}
    >
      <Presionable
        onPress={elegir}
        escala={0.98}
        accessibilityRole="button"
        accessibilityLabel={borrador.logo ? 'Cambiar logo' : 'Elegir logo'}
        style={[
          estilos.marco,
          { borderColor: borrador.logo ? borrador.colorPrimario : color.bordeFuerte, backgroundColor: color.superficie },
          !borrador.logo && { borderStyle: 'dashed' },
        ]}
      >
        {borrador.logo ? (
          <Image source={{ uri: borrador.logo.uri }} style={estilos.imagen} contentFit="cover" transition={200} />
        ) : (
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ImagePlus size={36} color={color.marcaTexto} />
            <Texto variante="detalle" tono="suave">
              Toca para elegir
            </Texto>
          </View>
        )}
      </Presionable>

      {borrador.logo && (
        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
          <Boton titulo="Cambiar" variante="contorno" tamano="compacto" onPress={elegir} cargando={cargando} />
          <Boton titulo="Quitar" variante="fantasma" tamano="compacto" onPress={() => actualizar({ logo: null })} />
        </View>
      )}
    </PantallaPaso>
  );
}

const estilos = StyleSheet.create({
  marco: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagen: { width: '100%', height: '100%' },
});
