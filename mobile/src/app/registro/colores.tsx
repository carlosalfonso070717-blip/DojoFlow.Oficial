import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Campo, Credencial, DatoCredencial, Presionable, Texto } from '@/components/ui';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro } from '@/onboarding/RegistroContexto';
import { mezclar, textoSobre } from '@/theme/color';
import { plural } from '@/utils/texto';

// Paleta curada: colores con suficiente cuerpo para botones y marcas
const PRINCIPALES = [
  '#d90429', '#e85d04', '#f4a100', '#2e7d32', '#00897b', '#0288d1',
  '#1565c0', '#3949ab', '#8e44ad', '#c2185b', '#6d4c41', '#37474f',
];

const esHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

export default function PasoColores() {
  const { borrador, actualizar, vistaPrevia, plantilla } = useRegistro();
  const [hex, setHex] = useState('');

  const principales = plantilla && !PRINCIPALES.includes(plantilla.colorPrimario) ? [plantilla.colorPrimario, ...PRINCIPALES] : PRINCIPALES;
  // Fondos para la credencial: carbón, uno profundo del mismo tono, uno claro y el de la plantilla
  const fondos = [
    ...new Set([
      plantilla?.colorSecundario ?? '#14161a',
      '#14161a',
      mezclar(borrador.colorPrimario, '#000000', 0.72),
      mezclar(borrador.colorPrimario, '#ffffff', 0.88),
      '#f7f7f5',
    ]),
  ];

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
      <View style={{ gap: 10 }}>
        <Texto variante="subtitulo">Color principal</Texto>
        <Muestras colores={principales} elegido={borrador.colorPrimario} onElegir={(c) => actualizar({ colorPrimario: c })} />
        <Campo
          etiqueta="O escribe un color"
          placeholder="#d90429"
          value={hex}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={7}
          error={hex.length === 7 && !esHex(hex) ? 'Usa el formato #RRGGBB' : null}
          onChangeText={(v) => {
            const limpio = v.startsWith('#') ? v : `#${v}`;
            setHex(limpio === '#' ? '' : limpio);
            if (esHex(limpio)) actualizar({ colorPrimario: limpio.toLowerCase() });
          }}
        />
      </View>

      <View style={{ gap: 10 }}>
        <Texto variante="subtitulo">Fondo de la credencial</Texto>
        <Muestras colores={fondos} elegido={borrador.colorSecundario} onElegir={(c) => actualizar({ colorSecundario: c })} />
      </View>
    </PantallaPaso>
  );
}

function Muestras({ colores, elegido, onElegir }: { colores: string[]; elegido: string; onElegir: (c: string) => void }) {
  return (
    <View style={estilos.muestras}>
      {colores.map((c) => {
        const activo = c.toLowerCase() === elegido.toLowerCase();
        return (
          <Presionable
            key={c}
            onPress={() => onElegir(c)}
            escala={0.9}
            accessibilityRole="radio"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={`Color ${c}`}
            style={[estilos.muestra, { backgroundColor: c, borderColor: activo ? mezclar(c, '#000000', 0.35) : 'rgba(0,0,0,0.08)' }]}
          >
            {activo && <Check size={20} color={textoSobre(c)} strokeWidth={3} />}
          </Presionable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  muestras: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  muestra: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
