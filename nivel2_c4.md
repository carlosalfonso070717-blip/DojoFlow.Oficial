# Arquitectura del Sistema - DojoFlow (Modelo C4)

Este documento describe el diseño técnico del sistema de gestión para el club de combate **DojoFlow**, estructurado mediante el modelo C4 para mantener los diagramas versionados como código en el repositorio.

---

## Diagrama C4 Nivel 2 — Contenedores del Sistema

**Nota:** * **Para quién es:** Arquitectos de software y líderes técnicos.
* **Qué responde:** ¿Cuáles son las piezas de software de alto nivel que componen el sistema (aplicaciones web, APIs, bases de datos) y cómo se comunican entre sí?

Este diagrama refleja la arquitectura de despliegue híbrida final (ver ADR-08): el frontend y la API viven contenerizados en AWS, mientras que la base de datos permanece on-premise, conectados mediante una VPN de malla.

```mermaid
flowchart TD
    Admin([Administrador del Dojo])
    Correo([Gmail SMTP\n*Servicio externo*])

    subgraph Cloudflare
        CF[Cloudflare\n*DNS + Proxy HTTPS*\ndojoflow.club]
    end

    subgraph "AWS EC2 - Contenedor Docker"
        UI[Frontend Web\n*HTML, CSS, JS*\nServido como archivos
            estáticos por la API]
        API[DojoFlow API\n*.NET 10 ASP.NET Core*\nMotor central, lógica de
            negocio y JWT Auth]
    end

    ECR[(Amazon ECR\n*Registro de imágenes
        Docker*)]
    GHA[GitHub Actions\n*Pipeline CI/CD*]

    subgraph "PC local de la academia"
        BD[(PostgreSQL\n*EF Core / Npgsql*\nPersistencia relacional)]
    end

    Admin -- "HTTPS" --> CF
    CF -- "Proxy HTTP" --> UI
    UI -- "Consume endpoints REST" --> API
    API -- "Lee y Escribe (túnel Tailscale)" --> BD
    API -- "Envía PIN de verificación
        / recuperación" --> Correo

    GHA -- "Build & push de la imagen" --> ECR
    GHA -- "Despliega por SSH" --> API
    ECR -- "docker pull" --> API
