# Arquitectura del Sistema - DojoFlow (Modelo C4)

Este documento describe el diseño técnico del sistema de gestión para el club de combate **DojoFlow**, estructurado mediante el modelo C4 para mantener los diagramas versionados como código en el repositorio.

---

## Diagrama C4 Nivel 2 — Contenedores del Sistema

**Nota:** * **Para quién es:** Arquitectos de software y líderes técnicos.
* **Qué responde:** ¿Cuáles son las piezas de software de alto nivel que componen el sistema (aplicaciones web, APIs, bases de datos) y cómo se comunican entre sí?

```mermaid
flowchart TD
    Admin([Administrador del Dojo])
    
    subgraph DojoFlow System
        UI[Frontend Web\n*HTML, CSS, JS*\nInterfaz visual del sistema]
        API[DojoFlow API\n*.NET 10 ASP.NET Core*\nMotor central y lógica de negocio]
        Almacenamiento[(Archivos JSON\n*System.IO*\nPersistencia de datos plana)]
    end
    
    Admin -- "Usa" --> UI
    UI -- "Consume endpoints REST" --> API
    API -- "Lee y Escribe" --> Almacenamiento