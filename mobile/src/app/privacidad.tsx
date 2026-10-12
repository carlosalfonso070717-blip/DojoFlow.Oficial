import { DocumentoLegal, type Seccion } from '@/components/DocumentoLegal';

const SECCIONES: Seccion[] = [
  {
    titulo: 'Quién es responsable de tus datos',
    parrafos: [
      'GestAcademy es una plataforma de gestión para academias (artes marciales, danza, música y otras disciplinas) desarrollada y operada por Solullan. Solullan es responsable del tratamiento de los datos de las cuentas que se registran en GestAcademy.',
      'Los datos de los alumnos que cada academia captura en la plataforma pertenecen a esa academia, que es responsable de ellos. GestAcademy solo los trata por cuenta de la academia, para prestarle el servicio.',
    ],
  },
  {
    titulo: 'Datos que recabamos',
    lista: [
      'De los dueños y coaches de cada academia: nombre, correo electrónico, contraseña (guardada cifrada, nunca en texto legible) y, si la eligen, una foto de perfil.',
      'Si entras con Google: tu nombre, tu correo electrónico y la confirmación de que Google verificó ese correo. No recibimos tu contraseña de Google ni accedemos a tu correo, contactos, archivos u otros datos de tu cuenta.',
      'De la academia: nombre, tipo de negocio, logotipo, colores, clases y precios.',
      'De los alumnos, capturados por la academia: nombre, teléfono, disciplinas, mensualidades, pagos, asistencias y la clave que usan en el registrador de asistencias.',
      'Datos técnicos mínimos para mantener tu sesión y la seguridad del servicio.',
    ],
  },
  {
    titulo: 'Para qué los usamos',
    lista: [
      'Crear tu cuenta, identificarte e iniciar tu sesión, incluido el acceso con Google.',
      'Prestar el servicio: administrar alumnos, cobros, asistencias, inventario y reportes de tu academia.',
      'Enviarte correos necesarios para el servicio, como códigos de verificación y de recuperación de contraseña.',
      'Mantener la seguridad de la plataforma y atender tus solicitudes de soporte.',
    ],
    nota: 'No vendemos tus datos, no los usamos para publicidad y no los compartimos para fines distintos a los de este aviso.',
  },
  {
    titulo: 'Uso de datos de Google',
    parrafos: [
      'El uso que GestAcademy hace de la información recibida de las APIs de Google se apega a la Política de Datos de Usuario de los Servicios de API de Google, incluidos los requisitos de Uso Limitado. Solo usamos tu nombre y correo para identificarte en GestAcademy; no los transferimos a terceros salvo lo necesario para prestar el servicio o cumplir la ley, y no los usamos para publicidad.',
    ],
  },
  {
    titulo: 'Con quién los compartimos',
    parrafos: ['Solo con proveedores que necesitamos para operar el servicio y que tratan los datos bajo nuestras instrucciones:'],
    lista: [
      'Proveedores de alojamiento y base de datos donde funciona la plataforma.',
      'Brevo, para el envío de correos de verificación y recuperación.',
      'Google, únicamente cuando eliges entrar con tu cuenta de Google.',
    ],
  },
  {
    titulo: 'Almacenamiento local y cookies',
    parrafos: [
      'Guardamos el token de tu sesión en el almacenamiento de tu navegador (o en el almacenamiento seguro de tu dispositivo) para que no tengas que entrar cada vez. No usamos cookies de rastreo ni publicidad. El botón de Google puede usar cookies propias de Google conforme a sus políticas.',
    ],
  },
  {
    titulo: 'Conservación y seguridad',
    parrafos: [
      'Conservamos los datos mientras la cuenta de la academia esté activa. Si la academia solicita cancelar su cuenta, eliminamos sus datos, salvo los que debamos conservar por obligación legal.',
      'Protegemos la información con conexiones cifradas (HTTPS), contraseñas cifradas y separación de los datos de cada academia.',
    ],
  },
  {
    titulo: 'Tus derechos (ARCO)',
    parrafos: [
      'Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus datos, así como revocar tu consentimiento, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. Si eres alumno de una academia, dirige tu solicitud a tu academia; nosotros le ayudaremos a atenderla.',
      'Para cualquier solicitud o duda sobre este aviso, contáctanos a través de solullan.com.',
    ],
  },
  {
    titulo: 'Cambios a este aviso',
    parrafos: ['Si cambiamos este aviso, publicaremos la nueva versión en esta página con su fecha de actualización.'],
  },
];

export default function Privacidad() {
  return (
    <DocumentoLegal
      titulo="Aviso de privacidad"
      actualizado="12 de octubre de 2026"
      intro="En GestAcademy cuidamos la información de las academias y de sus alumnos. Este aviso explica qué datos recabamos, para qué los usamos y cómo puedes ejercer tus derechos."
      secciones={SECCIONES}
    />
  );
}
