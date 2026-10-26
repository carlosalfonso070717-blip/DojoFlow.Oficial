import { router, useFocusEffect } from 'expo-router';
import { CalendarDays, ClipboardCheck, Clock, ShieldX, Tablet, UserCheck } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerAsistencias, type RegistroAsistencia } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { BotonAtras } from '@/components/BotonAtras';
import { GraficaBarras, type DatoBarra } from '@/components/GraficaBarras';
import { Segmentos } from '@/components/Segmentos';
import { Indicador, LuzAmbiental, Rejilla, Tarjeta, TituloSeccion } from '@/components/Tarjetas';
import { Avatar, Boton, EstadoVacio, Fila, Grupo, Insignia, Texto } from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { conAlfa } from '@/theme/color';
import { useTema } from '@/theme';
import { alerta } from '@/utils/alerta';
import { cantidad, plural } from '@/utils/texto';

type Periodo = 'hoy' | '7' | '30';

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
// Horario que se grafica en "Hoy"
const PRIMERA_HORA = 6;
const ULTIMA_HORA = 22;

const dosDigitos = (n: number) => String(n).padStart(2, '0');
const hora = (f: Date) => `${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`;
const fechaCorta = (f: Date) => `${DIAS[f.getDay()]} ${f.getDate()} ${MESES[f.getMonth()]}`;
const mismoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function rango(periodo: Periodo) {
  const hasta = new Date();
  const desde = new Date();
  desde.setHours(0, 0, 0, 0);
  if (periodo !== 'hoy') desde.setDate(desde.getDate() - (Number(periodo) - 1));
  return { desde, hasta };
}

// Barras del periodo: por hora para "Hoy", por día para 7 y 30 días
function barras(periodo: Periodo, registros: RegistroAsistencia[]): DatoBarra[] {
  const fechas = registros.map((r) => new Date(r.fechaHora));
  if (periodo === 'hoy') {
    return Array.from({ length: ULTIMA_HORA - PRIMERA_HORA + 1 }, (_, i) => {
      const h = PRIMERA_HORA + i;
      const valor = fechas.filter((f) => f.getHours() === h).length;
      return { clave: `h${h}`, etiqueta: String(h), valor, descripcion: `${h}:00: ${cantidad(valor, 'asistencia', 'asistencias')}` };
    });
  }
  const dias = Number(periodo);
  const { desde } = rango(periodo);
  return Array.from({ length: dias }, (_, i) => {
    const dia = new Date(desde);
    dia.setDate(desde.getDate() + i);
    const valor = fechas.filter((f) => mismoDia(f, dia)).length;
    return {
      clave: dia.toDateString(),
      etiqueta: dias <= 7 ? DIAS[dia.getDay()] : String(dia.getDate()),
      valor,
      descripcion: `${fechaCorta(dia)}: ${cantidad(valor, 'asistencia', 'asistencias')}`,
    };
  });
}

export default function AsistenciasScreen() {
  const { color } = useTema();
  const { margen, arriba, esEscritorio, esTableta, anchoSeccion } = useDiseno();
  const { perfil } = useSesion();
  const [periodo, setPeriodo] = useState<Periodo>('7');
  const [resultado, setResultado] = useState<{ periodo: Periodo; registros: RegistroAsistencia[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elegido, setElegido] = useState<number | null>(null);

  // Se recarga al entrar a la pantalla y al cambiar de periodo
  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      const { desde, hasta } = rango(periodo);
      obtenerAsistencias(desde, hasta)
        .then((registros) => {
          if (!vigente) return;
          setResultado({ periodo, registros });
          setError(null);
        })
        .catch((e: Error) => vigente && setError(e.message));
      return () => {
        vigente = false;
      };
      // La sucursal no se usa adentro: está para recargar el reporte al cambiar de sede
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodo, perfil?.academia.id]),
  );

  const registros = useMemo(() => (resultado?.periodo === periodo ? resultado.registros : []), [resultado, periodo]);
  const datosGrafica = useMemo(() => barras(periodo, registros), [periodo, registros]);

  if (!perfil) return null;
  const termino = perfil.academia.terminoAlumno || 'Alumno';
  const cargando = resultado?.periodo !== periodo && !error;

  const cambiarPeriodo = (p: Periodo) => {
    setPeriodo(p);
    setElegido(null);
  };

  // Cifras del periodo
  const entradas = registros.filter((r) => r.permitirAcceso).length;
  const negados = registros.length - entradas;
  const distintos = new Set(registros.map((r) => r.alumnoId)).size;
  const dias = periodo === 'hoy' ? 1 : Number(periodo);
  const pico = datosGrafica.reduce((m, d, i) => (d.valor > datosGrafica[m].valor ? i : m), 0);
  const constantes = Object.values(
    registros.reduce<Record<string, { nombre: string; veces: number }>>((acc, r) => {
      acc[r.alumnoId] = { nombre: r.nombreAlumno, veces: (acc[r.alumnoId]?.veces ?? 0) + 1 };
      return acc;
    }, {}),
  )
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 5);

  const indiceElegido = elegido ?? (periodo === 'hoy' ? pico : datosGrafica.length - 1);
  const barraElegida = datosGrafica[indiceElegido];

  const contenido = !perfil.academia.asistenciasActivas ? (
    <EstadoVacio
      icono={ClipboardCheck}
      titulo="El registrador de asistencias está apagado"
      mensaje="Actívalo en Ajustes para que tus alumnos registren su entrada con su PIN y veas aquí el reporte."
      accion={{ titulo: 'Ir a Ajustes', onPress: () => router.navigate('/ajustes') }}
    />
  ) : error ? (
    <EstadoVacio icono={ShieldX} tono="error" titulo="No se pudo cargar el reporte" mensaje={error} />
  ) : (
    <>
      <Rejilla columnas={esEscritorio || esTableta ? 4 : 2}>
        <Indicador icono={ClipboardCheck} etiqueta="Asistencias" valor={cargando ? '–' : String(entradas)} detalle={periodo === 'hoy' ? 'Hoy' : `Últimos ${dias} días`} />
        <Indicador icono={UserCheck} tono="exito" etiqueta={`${plural(termino)} distintos`} valor={cargando ? '–' : String(distintos)} />
        <Indicador
          icono={periodo === 'hoy' ? Clock : CalendarDays}
          tono="neutro"
          etiqueta={periodo === 'hoy' ? 'Hora con más entradas' : 'Promedio por día'}
          valor={cargando ? '–' : periodo === 'hoy' ? (datosGrafica[pico].valor > 0 ? `${datosGrafica[pico].etiqueta}:00` : '—') : (entradas / dias).toFixed(1)}
        />
        <Indicador
          icono={ShieldX}
          tono={negados > 0 ? 'peligro' : 'neutro'}
          etiqueta="Accesos negados"
          valor={cargando ? '–' : String(negados)}
          detalle="Por pago vencido"
        />
      </Rejilla>

      <Tarjeta style={{ gap: 4 }}>
        <Texto variante="subtitulo">{periodo === 'hoy' ? 'Entradas por hora' : 'Entradas por día'}</Texto>
        <Texto variante="detalle" tono="suave">
          {barraElegida?.descripcion}
        </Texto>
        <GraficaBarras
          datos={datosGrafica}
          elegido={indiceElegido}
          onElegir={setElegido}
          formatoGuia={(n) => String(n)}
          mensajeVacio={periodo === 'hoy' ? 'Todavía nadie ha registrado su entrada hoy' : 'Sin asistencias en este periodo'}
          cadaEtiqueta={periodo === '30' ? 5 : periodo === 'hoy' ? 3 : 1}
          colores={{
            activo: color.marca,
            inactivo: conAlfa(color.marca, 0.3),
            vacio: color.bordeFuerte,
            guia: color.borde,
            base: color.bordeFuerte,
            etiqueta: color.textoTenue,
            etiquetaActiva: color.texto,
            fondo: color.superficie,
          }}
        />
      </Tarjeta>

      <View style={esEscritorio ? estilos.columnas : { gap: 24 }}>
        <View style={[{ gap: 10 }, esEscritorio && { flex: 1 }]}>
          <TituloSeccion titulo="Más constantes" />
          {constantes.length === 0 ? (
            <Tarjeta>
              <Texto variante="detalle" tono="suave">
                Aquí aparecerán quienes más vienen.
              </Texto>
            </Tarjeta>
          ) : (
            <Grupo>
              {constantes.map((c, i) => (
                <Fila
                  key={c.nombre + i}
                  titulo={c.nombre}
                  izquierda={<Avatar nombre={c.nombre} tamano={36} />}
                  derecha={<Insignia tono={i === 0 ? 'marca' : 'neutro'} texto={cantidad(c.veces, 'vez', 'veces')} />}
                />
              ))}
            </Grupo>
          )}
        </View>

        <View style={[{ gap: 10 }, esEscritorio && { flex: 1.4 }]}>
          <TituloSeccion titulo="Registro de entradas" />
          {registros.length === 0 ? (
            <Tarjeta>
              <Texto variante="detalle" tono="suave">
                {cargando ? 'Cargando…' : 'Sin registros en este periodo.'}
              </Texto>
            </Tarjeta>
          ) : (
            <Grupo>
              {registros.slice(0, 60).map((r) => {
                const f = new Date(r.fechaHora);
                return (
                  <Fila
                    key={r.id}
                    titulo={r.nombreAlumno}
                    detalle={periodo === 'hoy' ? hora(f) : `${fechaCorta(f)} · ${hora(f)}`}
                    izquierda={<Avatar nombre={r.nombreAlumno} tamano={36} />}
                    derecha={
                      r.permitirAcceso ? <Insignia tono="exito" texto="Entró" /> : <Insignia tono="peligro" texto="Pago vencido" />
                    }
                  />
                );
              })}
            </Grupo>
          )}
          {registros.length > 60 && (
            <Texto variante="pequeno" tono="tenue" style={{ paddingHorizontal: 4 }}>
              Se muestran las 60 más recientes de {registros.length}.
            </Texto>
          )}
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.fondo }}>
      <LuzAmbiental />
      <ScrollView
        contentContainerStyle={[
          estilos.contenido,
          { paddingHorizontal: margen, paddingTop: 8 + arriba, maxWidth: esEscritorio ? anchoSeccion + margen * 2 : 760 },
        ]}
      >
        {!esEscritorio && <BotonAtras alterno="/" />}
        <View style={estilos.encabezado}>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="titulo" accessibilityRole="header">
              Asistencias
            </Texto>
            <Texto variante="detalle" tono="suave">
              Quién viene y cuándo, según el registrador de asistencias
            </Texto>
          </View>
          {esEscritorio && perfil.academia.asistenciasActivas && <AbrirRegistrador />}
        </View>
        {perfil.academia.asistenciasActivas && (
          <Segmentos<Periodo>
            valor={periodo}
            onCambio={cambiarPeriodo}
            opciones={[
              { valor: 'hoy', etiqueta: 'Hoy' },
              { valor: '7', etiqueta: '7 días' },
              { valor: '30', etiqueta: '30 días' },
            ]}
          />
        )}
        {contenido}
      </ScrollView>
    </SafeAreaView>
  );
}

function AbrirRegistrador() {
  const { vincularKiosco } = useSesion();
  return (
    <Boton
      titulo="Abrir registrador"
      icono={Tablet}
      variante="contorno"
      tamano="compacto"
      onPress={async () => {
        try {
          await vincularKiosco();
          router.push('/kiosco');
        } catch (e) {
          alerta('No se pudo abrir el registrador de asistencias', (e as Error).message);
        }
      }}
    />
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: 20, paddingBottom: 48, width: '100%', alignSelf: 'center' },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  columnas: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
});
