# DojoFlow API 🥋

**DojoFlow** es el sistema central para la gestión del "Dominio Combat Club", diseñado para administrar el registro de peleadores, control de disciplinas (MMA, Boxeo, JiuJitsu, etc.) y cálculo de mensualidades.

## 🏗️ Arquitectura
El proyecto está construido bajo los principios de la **Arquitectura Hexagonal (Puertos y Adaptadores)** en ASP.NET Core, garantizando que la lógica de negocio esté completamente aislada de la infraestructura (Bases de datos, frameworks, UI).

## 🚀 Últimas Actualizaciones (Checkpoint GOF)
En esta versión se implementaron dos patrones de diseño GOF para resolver problemas complejos de negocio:

1. **Patrón Builder (Creacional):** Se integró en la entidad `Alumno` para permitir la construcción segura y paso a paso de los peleadores que ingresan al tatami, asegurando que ningún alumno se registre sin datos obligatorios (Nombre, Apellido).
2. **Patrón Strategy (De Comportamiento):** Se implementó un motor de estrategias (`CalculadoraMensualidad`) para resolver el esquema de cobros multidisplina. El precio se calcula dinámicamente eliminando por completo las sentencias `if / else` y permitiendo paquetes de descuentos según la cantidad de disciplinas contratadas (1 a 5).

## Diagramas Modelo C4
Nivel 1:
[Haga clic aquí](https://github.com/carlosalfonso070717-blip/DojoFlow.Oficial/blob/uml/nivel1_c4.md)

Nivel 2:
[Haga clic aquí](https://github.com/carlosalfonso070717-blip/DojoFlow.Oficial/blob/uml/nivel2_c4.md)

Nivel 3:
[Haga clic aquí](https://github.com/carlosalfonso070717-blip/DojoFlow.Oficial/blob/uml/nivel3_c4.md)

## 📄 Documentación y Swagger
La API cuenta con una interfaz interactiva documentada y tematizada mediante Swagger, exponiendo los endpoints principales (`POST /api/Alumnos` y `GET /api/Alumnos`). Las decisiones de diseño están documentadas formalmente en la carpeta `ADRs`.
