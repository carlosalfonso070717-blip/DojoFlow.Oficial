# ADR-10: Registro controlado de coaches — verificación de correo por PIN y código de invitación

| Campo  | Valor |
|--------|-------|
| Autor  | Carlos Llanes |
| Fecha  | 31/07/2026 |
| Estado | `Aceptado`|

---

### 🔗 Contexto

El login original de DojoFlow permitía crear una cuenta de coach solo con usuario y contraseña, sin verificar que el correo proporcionado fuera real ni restringir quién podía registrarse. Al exponer el sistema en internet (ADR-09), esto se volvió un problema serio en dos frentes distintos: (1) cualquier persona podía registrarse con un correo inventado, y (2) DojoFlow es un sistema de **gestión administrativa interna** de la academia — no tiene sentido que cualquier visitante del sitio pueda crear una cuenta de coach con acceso completo al panel (alumnos, finanzas, inventario).

### Decisión

Implementar un flujo de registro en dos capas: primero, **verificación de correo mediante un PIN de 6 dígitos** enviado por correo (Gmail SMTP) que el usuario debe confirmar *antes* de poder enviar el formulario de registro; segundo, exigir un **código de invitación** — un valor secreto conocido solo por mí como administrador — que debe coincidir exactamente para que el backend acepte la creación de la cuenta. Ambas validaciones ocurren en el servidor (`AuthController`), nunca solo en el frontend.

### ¿Por qué?

Separé estas dos validaciones porque resuelven problemas distintos: el PIN de correo confirma que el correo escrito es *alcanzable* (evita cuentas con correos falsos o mal escritos), mientras que el código de invitación confirma que la persona fue *autorizada por mí* a tener una cuenta — ninguna de las dos por sí sola resolvía ambos problemas. Elegí un PIN numérico de 6 dígitos con expiración de 15 minutos, en vez de un enlace de verificación por correo, porque en una prueba real con mi celular el enlace no abría de forma consistente entre dispositivos; el PIN, al escribirse directamente en el mismo formulario donde inició el registro, funciona igual sin importar desde dónde se abrió el correo. El código de invitación se guarda como variable de entorno/secreto (igual que `JWT_KEY`), nunca en el código fuente ni visible en el sitio, y se comparte manualmente (verbal o por mensaje) solo con las personas que van a ser coaches.

### Alternativas consideradas

| Alternativa | Por qué la descarté |
| :--- | :--- |
| **Verificación por enlace enviado al correo** | En pruebas reales, abrir el enlace desde el correo en el celular no siempre redirigía correctamente de vuelta al formulario de registro en el navegador donde se inició el proceso, generando una mala experiencia entre dispositivos. |
| **Registro abierto sin ninguna restricción adicional** | Es la opción más simple, pero inaceptable para un sistema administrativo: cualquier persona en internet podría auto-otorgarse acceso completo a los datos financieros y de alumnos de la academia. |
| **Aprobación manual de cada cuenta por el administrador** | Es más segura aún que el código de invitación, pero agrega fricción y trabajo manual innecesario para una academia con muy pocos coaches; el código de invitación logra el mismo nivel de control con mucho menos esfuerzo operativo. |
| **CAPTCHA / reCAPTCHA** | Resuelve el problema de bots automatizados, pero no el problema real que quería resolver (que solo personas autorizadas por mí puedan tener cuenta); se descartó por ahora y queda como mejora futura. |

---

### Consecuencias

**Lo que gano:**
* **Consecuencia técnica:** Ninguna cuenta puede crearse sin dos condiciones simultáneas verificadas en el servidor: correo alcanzable y autorización explícita del administrador, cerrando el registro público que existía antes.
* **Consecuencia sobre el proceso:** Puedo dar de alta nuevos coaches simplemente compartiéndoles el código de invitación, sin necesitar crear sus cuentas manualmente por base de datos.

**Lo que sacrifico o asumo:**
* **Limitación técnica:** Si el código de invitación se filtra, cualquiera que lo tenga puede registrarse; la mitigación es que puedo rotarlo en cualquier momento cambiando el secreto, sin afectar a las cuentas ya creadas.
* **Deuda o riesgo:** El envío de correos depende de un servicio externo (Gmail SMTP); si Gmail bloquea o limita la cuenta remitente, el flujo de verificación (y de recuperación de contraseña, que reutiliza el mismo mecanismo de PIN) dejaría de funcionar hasta resolverlo.

### Declaración de Uso de IA

Usé IA como apoyo para implementar el envío de correos por SMTP, la lógica de expiración del PIN con BCrypt, y el código del middleware de validación del código de invitación en el backend. La decisión de usar dos capas de verificación en vez de una sola, de descartar el enlace por correo a favor del PIN, y de resolverlo con un código de invitación en vez de aprobación manual o CAPTCHA, fueron decisiones mías basadas en la experiencia real de uso desde mi celular y en las necesidades de mi academia.
