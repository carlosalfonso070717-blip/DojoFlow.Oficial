# Arquitectura del Sistema - DojoFlow (Modelo C4)

Este documento describe el diseño técnico del sistema de gestión para el club de combate **DojoFlow**, estructurado mediante el modelo C4 para mantener los diagramas versionados como código en el repositorio.

---

## Diagrama C4 Nivel 1 — Contexto del Sistema

**Nota:** * **Para quién es:** Stakeholders, profesores, dueños del negocio y personal no técnico.
* **Qué responde:** ¿Cuál es el panorama general? ¿Quién usa el sistema y cuál es su propósito fundamental sin entrar en detalles técnicos?

Desde la versión final del proyecto, DojoFlow es accesible públicamente por internet (`https://dojoflow.club`) en vez de únicamente desde la red local de la academia, y el sistema depende de un proveedor de correo externo para verificar la identidad de los coaches que se registran.

```mermaid
flowchart TD
    Admin([Administrador del Dojo\n*Accede desde cualquier lugar vía internet*])
    Correo([Servicio de Correo\n*Gmail SMTP*])

    System(DojoFlow System\n*Gestión integral del club*)

    Admin -- "Gestiona alumnos, inventario, mensualidades y finanzas" --> System
    System -- "Envía PIN de verificación y recuperación de contraseña" --> Correo
    Correo -- "Entrega el correo al Administrador" --> Admin
