# Arquitectura del Sistema - DojoFlow (Modelo C4)

Este documento describe el diseño técnico del sistema de gestión para el club de combate **DojoFlow**, estructurado mediante el modelo C4 para mantener los diagramas versionados como código en el repositorio.

---

## Diagrama C4 Nivel 1 — Contexto del Sistema

**Nota:** * **Para quién es:** Público en general
* **Qué responde:** ¿Cuál es el panorama general? ¿Quién usa el sistema y cuál es su propósito fundamental sin entrar en detalles técnicos?

```mermaid
flowchart TD
    Admin([Administrador del Dojo])
    
    System(DojoFlow System\n*Gestión integral del club*)
    
    Admin -- "Opera en" --> System
