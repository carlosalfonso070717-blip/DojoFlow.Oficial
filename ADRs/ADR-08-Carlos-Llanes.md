# ADR-08: Evolución de DojoFlow a un sistema en producción — Persistencia, Despliegue Híbrido en la Nube y Seguridad de Registro

| Campo  | Valor |
|--------|-------|
| Autor  | Carlos Llanes |
| Fecha  | 31/07/2026 |
| Estado | `Aceptado`|

---

### 🔗 Contexto

Hasta este punto, DojoFlow era un proyecto que corría únicamente en local, persistiendo su información en archivos JSON planos y sin ningún mecanismo real de control de acceso al registro de coaches. Para que DojoFlow deje de ser solo una entrega académica y se convierta en el sistema que mi academia va a usar de verdad, necesitaba resolver tres problemas al mismo tiempo: (1) un motor de persistencia que soportara integridad y concurrencia real, (2) una forma de exponer el sistema en internet sin poder pagar infraestructura administrada, y (3) evitar que cualquier desconocido en internet pudiera crearse una cuenta de coach con acceso administrativo completo. Documento las tres decisiones juntas en este ADR porque se tomaron en la misma etapa del proyecto y están fuertemente relacionadas entre sí: ninguna tiene sentido sin las otras dos.

### Decisión

1. **Persistencia:** Reemplazar los archivos JSON por **PostgreSQL**, usando **Entity Framework Core** (proveedor Npgsql) como ORM y **EF Core Migrations** (`Database.Migrate()`) como mecanismo formal de evolución del esquema, en lugar de `EnsureCreated()`.
2. **Despliegue:** Adoptar una **arquitectura de despliegue híbrida**: la API de DojoFlow (junto con el frontend, servido como archivos estáticos desde el mismo contenedor) se despliega en un contenedor **Docker** sobre una instancia **EC2** de AWS, mientras que **PostgreSQL permanece corriendo en mi PC local**, conectada a la EC2 mediante una **VPN de malla (Tailscale)**. El pipeline de **GitHub Actions** (ya existente desde ADR-07) se extendió para construir la imagen Docker, subirla a **Amazon ECR**, y desplegarla por SSH en la instancia EC2 en cada push a la rama `deploy`. El acceso público se sirve a través de **Cloudflare** (`https://dojoflow.club`) por HTTPS.
3. **Seguridad de registro:** Implementar un flujo de registro en dos capas: **verificación de correo mediante un PIN de 6 dígitos** enviado por correo (Gmail SMTP), que el usuario debe confirmar antes de poder enviar el formulario; y un **código de invitación** secreto, conocido solo por mí como administrador, que debe coincidir exactamente para que el backend acepte la creación de la cuenta.

### ¿Por qué?

**Persistencia:** La Arquitectura Hexagonal que ya tenía DojoFlow hizo esta migración de bajo riesgo: como el dominio y los casos de uso solo dependían de interfaces de repositorio, pude reemplazar por completo la implementación (de `InMemoryAlumnoRepository` a `EfAlumnoRepository`) sin tocar la lógica de negocio ni los controladores. Elegí PostgreSQL por ser open-source, gratuito, y con soporte de primer nivel en .NET vía Npgsql. Elegí Migrations sobre `EnsureCreated()` porque necesito poder versionar los cambios de esquema sin perder los datos ya cargados por la academia.

**Despliegue:** Descarté pagar por una base de datos administrada porque el presupuesto del proyecto es $0 y ya cuento con el hardware necesario en la propia PC de la academia. Elegí Tailscale porque no requiere exponer ni configurar un servidor VPN propio: cada dispositivo se autentica contra la red de Tailscale y se ven entre sí mediante IPs privadas, sin abrir el puerto 5432 de Postgres a internet. Contenerizar la API con Docker garantiza que el entorno de ejecución sea idéntico entre mi máquina de desarrollo y la instancia EC2.

**Seguridad de registro:** Separé las dos validaciones porque resuelven problemas distintos: el PIN de correo confirma que el correo es *alcanzable* (evita cuentas con correos falsos), mientras que el código de invitación confirma que la persona fue *autorizada por mí* — ninguna de las dos por sí sola resolvía ambos problemas. Elegí un PIN numérico con expiración de 15 minutos, en vez de un enlace de verificación por correo, porque en pruebas reales desde el celular el enlace no abría de forma consistente entre dispositivos; el PIN, al escribirse en el mismo formulario donde inició el registro, funciona igual sin importar desde dónde se abrió el correo.

### Alternativas consideradas

| Alternativa | Por qué la descarté |
| :--- | :--- |
| **SQLite** | Válido como motor embebido, pero inviable para un despliegue donde la API corre en un contenedor separado y necesita acceso remoto/concurrente a los datos. |
| **Amazon RDS (PostgreSQL administrado)** | Es la opción más robusta, pero tiene un costo mensual fijo que no puedo cubrir en esta etapa; ya tengo el hardware disponible en la academia. |
| **Exponer PostgreSQL directamente a internet (puerto 5432 público)** | Técnicamente más simple, pero un riesgo de seguridad inaceptable: expondría la base de datos completa a escaneos y ataques de fuerza bruta desde cualquier parte del mundo. |
| **Desplegar todo (API + BD) en la misma EC2** | Elimina la necesidad de una VPN, pero me obliga a pagar/mantener almacenamiento y backups en la nube, perdiendo la ventaja de costo $0 de usar mi propio hardware. |
| **Verificación por enlace enviado al correo** | En pruebas reales, abrir el enlace desde el celular no siempre redirigía correctamente de vuelta al formulario en el navegador donde se inició el registro. |
| **Registro abierto sin restricción adicional** | Inaceptable para un sistema administrativo: cualquier persona en internet podría auto-otorgarse acceso completo a los datos financieros y de alumnos. |
| **Aprobación manual de cada cuenta por el administrador** | Más segura aún que el código de invitación, pero agrega fricción y trabajo manual innecesario para una academia con muy pocos coaches. |

---

### Consecuencias

**Lo que gano:**
* **Consecuencia técnica:** Integridad real de los datos (claves foráneas, restricciones únicas), un sistema accesible desde cualquier parte del mundo sin exponer jamás la base de datos a una IP pública, y ninguna cuenta de coach puede crearse sin correo verificado + autorización explícita del administrador.
* **Consecuencia sobre el proceso:** Costo de infraestructura prácticamente $0 (EC2 en capa gratuita, base de datos en hardware propio), cada cambio de esquema queda versionado como migración, y puedo dar de alta nuevos coaches solo compartiéndoles el código de invitación.

**Lo que sacrifico o asumo:**
* **Limitación técnica:** El sistema completo depende de que mi PC local esté encendida y con Tailscale conectado; si se apaga o pierde conexión, el frontend carga pero el login y los datos dejan de funcionar. Esto es un riesgo de disponibilidad aceptado conscientemente a cambio de costo $0 (ver evaluación en [`ATAM.md`](../ATAM.md)).
* **Deuda o riesgo:** Al no usar una IP elástica en la EC2, la IP pública cambia cada vez que detengo/inicio la instancia, obligándome a actualizar manualmente Cloudflare y el secreto `EC2_HOST`. Si el código de invitación se filtra, cualquiera que lo tenga puede registrarse, aunque puedo rotarlo en cualquier momento. El envío de correos depende de Gmail SMTP como servicio externo.

### Declaración de Uso de IA

Utilicé IA como apoyo para redactar el código de los repositorios EF Core, el `Dockerfile`, el workflow de GitHub Actions, el envío de correos por SMTP y la lógica de expiración del PIN, así como para diagnosticar errores de conexión (contraseña de Postgres, `PendingModelChangesWarning`, `pg_hba.conf`, procesos de Tailscale bloqueados). Las decisiones de arquitectura en sí —migrar a PostgreSQL con Migrations, mantener la base de datos local en vez de pagar un servicio administrado, usar una VPN de malla en vez de exponer el puerto directamente, y resolver el registro con PIN + código de invitación en vez de un enlace o aprobación manual— fueron mías, evaluadas contra mi presupuesto real, mis prioridades de seguridad y la experiencia real de uso desde mi celular.
