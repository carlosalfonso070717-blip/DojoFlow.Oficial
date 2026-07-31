# Arquitectura del Sistema - DojoFlow (Modelo C4)

Este documento describe el diseño técnico del sistema de gestión para el club de combate **DojoFlow**, estructurado mediante el modelo C4 para mantener los diagramas versionados como código en el repositorio.

---

## Diagrama C4 Nivel 3 — Componentes de la API

**Nota:** * **Para quién es:** Desarrolladores de software del equipo.
* **Qué responde:** ¿Cómo está estructurado el código por dentro de la pieza principal (la API)? Detalla los bloques de construcción, responsabilidades y la implementación de Clean Architecture.

La capa de Infraestructura ya no serializa/deserializa JSON (ver ADR-08): ahora implementa las interfaces de repositorio contra PostgreSQL vía Entity Framework Core. Se agregó además el `AuthController` con su propio flujo de verificación (ver ADR-08).

```mermaid
flowchart TD
    UI[Frontend Web]

    subgraph "DojoFlow API - Clean Architecture"
        Controllers[Controladores REST\n*Alumnos, Finanzas, Inventario, Mensualidades, Auth*]
        Auth[AuthController\n*JWT, verificación por PIN, código de invitación*]
        UseCases[Casos de Uso / Application\n*Reglas de orquestación e interfaces de repositorio*]
        Domain[Dominio\n*Entidades principales y Patrones (State, Observer, Builder, Strategy)*]
        Repos["Infraestructura / Repositorios EF Core\n*Ef*Repository (Alumno, Mensualidad, Producto, RegistroFinanciero, UsuarioCoach, VerificacionEmail)*"]
        DbContext[DojoFlowDbContext\n*Mapeo entidad-tabla, seeding, migraciones*]
    end

    BD[(PostgreSQL\n*Npgsql*)]
    Correo[[Gmail SMTP]]

    UI -- "Peticiones HTTP" --> Controllers
    UI -- "Login / Registro / Recuperación" --> Auth
    Controllers -- "Delega ejecución a" --> UseCases
    Auth -- "Genera y valida" --> UseCases
    UseCases -- "Aplica reglas sobre" --> Domain
    Controllers -- "Inyecta dependencias a" --> Repos
    Auth -- "Envía PIN vía" --> Correo
    Repos -- "Implementa interfaces de" --> Domain
    Repos -- "Usa" --> DbContext
    DbContext -- "Consultas SQL / Migraciones" --> BD
