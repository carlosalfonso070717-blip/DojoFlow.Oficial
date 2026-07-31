# DojoFlow API 🥋

**DojoFlow** es el sistema central para la gestión del "Dominio Combat Club", diseñado para administrar el registro de peleadores, control de disciplinas (MMA, Boxeo, JiuJitsu, etc.), mensualidades, inventario y finanzas.

## 🌐 Demo en vivo

[![Despliegue AWS](https://github.com/carlosalfonso070717-blip/DojoFlow.Oficial/actions/workflows/deploy.yml/badge.svg?branch=deploy)](https://github.com/carlosalfonso070717-blip/DojoFlow.Oficial/actions/workflows/deploy.yml)

* **Sitio funcional:** [https://dojoflow.club](https://dojoflow.club)
* **Pipeline CI/CD visible:** cada push a la rama `deploy` corre las pruebas unitarias, construye la imagen Docker, la publica en Amazon ECR y la despliega automáticamente — ver la pestaña [Actions](https://github.com/carlosalfonso070717-blip/DojoFlow.Oficial/actions/workflows/deploy.yml) del repositorio.

## 🏗️ Arquitectura

El proyecto está construido bajo los principios de la **Arquitectura Hexagonal (Puertos y Adaptadores)** en .NET 10 / ASP.NET Core, garantizando que la lógica de negocio esté completamente aislada de la infraestructura (base de datos, frameworks, UI). El sistema se despliega en una arquitectura **híbrida**: la API y el frontend corren en un contenedor Docker sobre AWS EC2, mientras que la base de datos PostgreSQL permanece local en la academia, conectada mediante una VPN Tailscale.

La documentación de arquitectura completa (modelo C4, decisiones de diseño y evaluación ATAM) está en:

* [`arquitectura.md`](./arquitectura.md) — Punto de entrada al modelo C4 (Niveles 1 a 3).
* [`ADRs/`](./ADRs) — Registro de decisiones de arquitectura (ADR-01 a ADR-08).
* [`ATAM.md`](./ATAM.md) — Evaluación ATAM (riesgo, trade-off y punto de sensibilidad).

## 🚀 Funcionalidades principales

1. **Gestión de alumnos, mensualidades, inventario y finanzas**, con persistencia en PostgreSQL vía Entity Framework Core (ver [ADR-08](./ADRs/ADR-08-Carlos-Llanes.md)).
2. **Patrón Builder (Creacional):** integrado en la entidad `Alumno` para garantizar que ningún alumno se registre sin sus datos obligatorios.
3. **Patrón Strategy (De Comportamiento):** motor de estrategias (`CalculadoraMensualidad`) para el esquema de cobros multidisciplina, eliminando sentencias `if / else` anidadas.
4. **Autenticación JWT** con registro controlado: verificación de correo por PIN y código de invitación para evitar altas no autorizadas de coaches (ver [ADR-08](./ADRs/ADR-08-Carlos-Llanes.md)).
5. **Despliegue automatizado** vía GitHub Actions hacia AWS (Docker + ECR + EC2), con pruebas unitarias (xUnit) corriendo en cada push (ver [ADR-07](./ADRs/ADR-07-Carlos-Llanes.md) y [ADR-08](./ADRs/ADR-08-Carlos-Llanes.md)).

## 📄 Documentación y Swagger

La API cuenta con una interfaz interactiva documentada mediante Swagger, exponiendo los endpoints principales del sistema.
