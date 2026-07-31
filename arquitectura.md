# Arquitectura del Sistema - DojoFlow (Modelo C4)

Este documento es el punto de entrada a la documentación de arquitectura de **DojoFlow**, estructurada mediante el modelo C4 y versionada como código en el repositorio. Los tres niveles se mantienen en archivos separados para que cada uno pueda evolucionar de forma independiente:

* [`nivel1_c4.md`](./nivel1_c4.md) — **Contexto del sistema.** Quién usa DojoFlow y con qué sistemas externos interactúa (Gmail SMTP).
* [`nivel2_c4.md`](./nivel2_c4.md) — **Contenedores.** La arquitectura de despliegue híbrida final: Frontend + API en un contenedor Docker sobre AWS EC2, PostgreSQL corriendo on-premise en la PC de la academia, conectados por una VPN Tailscale, con Cloudflare al frente y GitHub Actions + Amazon ECR como pipeline de CI/CD.
* [`nivel3_c4.md`](./nivel3_c4.md) — **Componentes.** Cómo está estructurada la API por dentro bajo Clean/Arquitectura Hexagonal (Controllers, Application, Domain, Infraestructura con EF Core).

## Documentación relacionada

* [`ADRs/`](./ADRs) — Registro de decisiones de arquitectura (ADR-01 a ADR-10), documentando la evolución del proyecto desde su diseño inicial hasta el despliegue híbrido en la nube.
* [`ATAM.md`](./ATAM.md) — Evaluación ATAM del sistema: riesgos, trade-offs y puntos de sensibilidad identificados sobre la arquitectura final.
* [`Arq_Views/`](./Arq_Views) — Vistas complementarias de arquitectura (lógica, procesos, desarrollo y despliegue).

## Resumen de la arquitectura final

DojoFlow es un sistema de gestión administrativa para el club de combate **Dominio Combat Club**, construido en **.NET 10** bajo **Arquitectura Hexagonal (Puertos y Adaptadores)**. La API y el frontend se despliegan como un único contenedor **Docker** sobre una instancia **AWS EC2**, mientras que la base de datos **PostgreSQL** permanece corriendo localmente en la PC de la academia y se conecta mediante un túnel privado **Tailscale**, evitando exponer la base de datos a internet (ver ADR-09). El acceso público se sirve a través de **Cloudflare** (`https://dojoflow.club`), y cada cambio en la rama `deploy` dispara automáticamente el pipeline de **GitHub Actions**, que corre las pruebas unitarias, construye la imagen Docker, la publica en **Amazon ECR** y la despliega en la instancia EC2.
