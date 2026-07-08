# Arquitectura del Sistema - DojoFlow (Modelo C4) 

Este documento describe el diseño técnico del sistema de gestión para el club de combate **DojoFlow**, estructurado mediante el modelo C4 para mantener los diagramas versionados como código en el repositorio.

---

## Diagrama C4 Nivel 3 — Componentes

**Nota:** * **Para quién es:** Desarrolladores de software del equipo.
* **Qué responde:** ¿Cómo está estructurado el código por dentro de la pieza principal (la API)? Detalla los bloques de construcción, responsabilidades y la implementación de Clean Architecture.

```mermaid
flowchart TD
    UI[Frontend Web]
    
    subgraph DojoFlow API - Clean Architecture
        Controllers["Controladores REST\n*Alumnos, Finanzas, Inventario, Mensualidades*"]
        UseCases["Casos de Uso / Application\n*Reglas de orquestación (ej. RegistrarAlumnoUseCase)*"]
        Domain["Dominio\n*Entidades principales y Patrones (State, Observer)*"]
        Repos["Infraestructura / Repositorios\n*Implementación técnica de lectura/escritura*"]
    end
    
    Almacenamiento[(Archivos JSON locales)]

    UI -- "Peticiones HTTP" --> Controllers
    Controllers -- "Delega ejecución a" --> UseCases
    UseCases -- "Aplica reglas sobre" --> Domain
    Controllers -- "Inyecta dependencias a" --> Repos
    Repos -- "Implementa interfaces de" --> Domain
    Repos -- "Serializa / Deserializa" --> Almacenamiento
