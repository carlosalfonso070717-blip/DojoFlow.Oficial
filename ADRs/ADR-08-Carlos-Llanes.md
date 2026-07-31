# ADR-08: Migración de la persistencia de Archivos JSON a PostgreSQL con EF Core

| Campo  | Valor |
|--------|-------|
| Autor  | Carlos Llanes |
| Fecha  | 29/07/2026 |
| Estado | `Aceptado`|

---

### 🔗 Contexto

DojoFlow venía persistiendo toda su información (alumnos, mensualidades, productos, registros financieros) en archivos JSON planos leídos y escritos mediante `System.IO`. Este esquema fue útil para el prototipado inicial, pero al preparar el sistema para un uso real en la academia (y no solo como entrega académica) se volvió insostenible: no soporta escrituras concurrentes de forma segura, no garantiza integridad referencial entre entidades relacionadas (por ejemplo, una `Mensualidad` que apunta a un `Alumno` inexistente), y no permite consultas ni migraciones de esquema controladas. Al pasar de "proyecto de clase" a "sistema que mi academia va a usar de verdad", necesitaba un motor de base de datos real detrás de la Arquitectura Hexagonal ya existente.

### Decisión

Reemplazar la capa de infraestructura de persistencia basada en archivos JSON por **PostgreSQL**, usando **Entity Framework Core** con el proveedor **Npgsql** como ORM, y adoptar **EF Core Migrations** (`Database.Migrate()`) como mecanismo formal de evolución del esquema, en lugar de `EnsureCreated()`.

### ¿Por qué?

La Arquitectura Hexagonal que ya tenía DojoFlow hizo esta migración de bajo riesgo: como el dominio y los casos de uso solo dependían de interfaces de repositorio (`IAlumnoRepository`, `IMensualidadRepository`, etc.), pude reemplazar por completo la implementación (`InMemoryAlumnoRepository` → `EfAlumnoRepository`) sin tocar una sola línea de lógica de negocio ni de los controladores. Elegí PostgreSQL sobre otras opciones porque es open-source, gratuito, y tiene soporte de primer nivel en .NET a través de Npgsql. Elegí Migrations sobre `EnsureCreated()` porque en un sistema que va a evolucionar con el tiempo (nuevas entidades, nuevas columnas) necesito poder versionar los cambios de esquema igual que versiono el código, sin perder datos ya cargados por la academia.

### Alternativas consideradas

| Alternativa | Por qué la descarté |
| :--- | :--- |
| **SQLite** | Es un buen motor embebido, pero al planear un despliegue donde la API corre en un contenedor separado de la base de datos, un archivo SQLite local no es viable para acceso remoto ni concurrente. |
| **MongoDB (NoSQL)** | El dominio de DojoFlow es fuertemente relacional (Alumno–Mensualidad–Producto–RegistroFinanciero), así que un modelo documental no aporta ventajas y complica las validaciones de integridad que sí me da un motor relacional. |
| **`EnsureCreated()` en vez de Migrations** | Es más rápido para prototipar, pero borra/recrea el esquema sin registrar el historial de cambios, lo cual es inaceptable en cuanto hay datos reales de alumnos que no se pueden perder cada vez que cambia el modelo. |

---

### Consecuencias

**Lo que gano:**
* **Consecuencia técnica:** Integridad de datos real (claves foráneas, restricciones únicas como el correo de cada coach) y la posibilidad de escalar el volumen de alumnos sin degradar el rendimiento como sí pasaría leyendo/escribiendo un JSON completo en cada operación.
* **Consecuencia sobre el proceso:** Cada cambio de modelo queda documentado como una migración versionada en el repositorio, permitiendo reconstruir el esquema desde cero o auditar cómo evolucionó.

**Lo que sacrifico o asumo:**
* **Limitación técnica:** Ahora el sistema depende de un servidor de base de datos disponible y corriendo; si Postgres no responde, la API completa deja de funcionar (antes un archivo JSON corrupto solo afectaba a esa entidad puntual).
* **Deuda o riesgo:** Tuve que resolver dos veces un `PendingModelChangesWarning` de EF Core (por un `ValueComparer` faltante en una propiedad de tipo lista, y por un seed que usaba un constructor no determinista), lo que me dejó como aprendizaje que el seeding de datos debe construirse siempre con valores completamente estáticos.

### Declaración de Uso de IA

Para esta etapa utilicé IA como apoyo para redactar el código de los repositorios EF Core, diagnosticar los errores de `PendingModelChangesWarning` y validar la versión correcta del paquete Npgsql. La decisión de migrar a PostgreSQL, de usar Migrations en vez de `EnsureCreated()`, y la evaluación de las alternativas descartadas fueron mías, basadas en los requisitos reales de mi academia.
