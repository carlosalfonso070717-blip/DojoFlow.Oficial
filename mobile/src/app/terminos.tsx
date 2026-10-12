import { DocumentoLegal, type Seccion } from '@/components/DocumentoLegal';

const SECCIONES: Seccion[] = [
  {
    titulo: 'El servicio',
    parrafos: [
      'GestAcademy es una plataforma, desarrollada y operada por Solullan, para administrar academias: alumnos, cobros, asistencias, inventario y finanzas. Al crear una cuenta o usar la plataforma aceptas estos términos.',
    ],
  },
  {
    titulo: 'Tu cuenta',
    lista: [
      'Debes dar información verdadera y mantener actualizado tu correo.',
      'Eres responsable de cuidar tu contraseña o el acceso a tu cuenta de Google, y de lo que ocurra con tu cuenta.',
      'El dueño de la academia decide quién más tiene acceso (por ejemplo, sus coaches) y responde por su uso.',
    ],
  },
  {
    titulo: 'Datos de tus alumnos',
    parrafos: [
      'La academia es responsable de los datos de sus alumnos que captura en GestAcademy: debe contar con su consentimiento (o el de sus padres o tutores, si son menores) y tratarlos conforme a la ley. GestAcademy los trata solo para prestar el servicio, como se describe en el Aviso de privacidad.',
    ],
  },
  {
    titulo: 'Uso aceptable',
    parrafos: ['No está permitido usar la plataforma para:'],
    lista: [
      'Actividades ilegales o que infrinjan derechos de terceros.',
      'Intentar acceder a datos de otras academias o vulnerar la seguridad del servicio.',
      'Interferir con el funcionamiento de la plataforma o usarla de forma automatizada abusiva.',
    ],
  },
  {
    titulo: 'Disponibilidad y cambios',
    parrafos: [
      'Trabajamos para que GestAcademy esté disponible y funcione bien, pero el servicio se ofrece “tal cual” y puede tener interrupciones por mantenimiento o causas ajenas. Podemos mejorar, cambiar o retirar funciones; si un cambio afecta de forma importante tu uso, lo avisaremos.',
      'Las condiciones comerciales (planes y pagos), cuando apliquen, se acuerdan por separado con cada academia.',
    ],
  },
  {
    titulo: 'Responsabilidad',
    parrafos: [
      'GestAcademy es una herramienta de apoyo: la academia es responsable de revisar sus cobros, reportes y decisiones. En la medida que permita la ley, Solullan no responde por daños indirectos o pérdidas derivadas del uso o la imposibilidad de usar el servicio.',
    ],
  },
  {
    titulo: 'Cancelación',
    parrafos: [
      'Puedes dejar de usar GestAcademy y solicitar la cancelación de tu cuenta en cualquier momento. Podemos suspender cuentas que incumplan estos términos.',
    ],
  },
  {
    titulo: 'Ley aplicable y contacto',
    parrafos: [
      'Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para dudas o aclaraciones, contáctanos a través de solullan.com.',
    ],
  },
];

export default function Terminos() {
  return (
    <DocumentoLegal
      titulo="Términos y condiciones"
      actualizado="12 de octubre de 2026"
      intro="Estas son las reglas para usar GestAcademy. Las escribimos claras y cortas."
      secciones={SECCIONES}
    />
  );
}
