# ADR-07: Implementación de Pruebas Unitarias (xUnit) y Pipeline CI para DojoFlow

| Campo | Valor |
| :--- | :--- |
| **Autor** | Carlos Llanes |
| **Fecha** | 22/07/2026 |
| **Estado** | Aceptado |

---

### 🔗 Contexto

Conforme DojoFlow sigue creciendo en funcionalidades, existe el riesgo de introducir *bugs* o romper reglas de negocio existentes al agregar nuevo código (regresiones). Además, como parte de los estándares de ingeniería de software requeridos para la evaluación académica y las buenas prácticas de la industria, el sistema necesita un mecanismo automatizado que valide el correcto funcionamiento del código antes de integrarlo a las ramas principales. 

### Decisión

Implementar una suite de pruebas unitarias utilizando el framework **xUnit** centrada exclusivamente en la **Capa de Dominio**, y configurar un pipeline de Integración Continua (CI) mediante **GitHub Actions**.

### ¿Por qué?

Decidí probar específicamente la capa de Dominio (Entities, States, ValueObjects) porque ahí es donde residen las reglas de negocio más críticas de DojoFlow (lógica de mensualidades, cálculos, estados). Al ser la capa más interna de la Arquitectura Hexagonal, no tiene dependencias de infraestructura (Bases de Datos, APIs, UI), lo que permite que las pruebas sean deterministas, extremadamente rápidas y fáciles de aislar. 

Para el framework, xUnit es el estándar moderno recomendado para aplicaciones .NET. Para la automatización, GitHub Actions ofrece una integración nativa e inmediata con nuestro repositorio, permitiendo correr las pruebas automáticamente con cada `push` o `pull request` sin necesidad de configurar servidores externos.

### Alternativas consideradas

| Alternativa | Por qué la descarté |
| :--- | :--- |
| **NUnit / MSTest** | Aunque son frameworks válidos en C#, xUnit obliga a mejores prácticas de diseño (como evitar variables estáticas compartidas entre pruebas) y tiene una sintaxis más limpia y moderna. |
| **Pruebas de Integración (End-to-End)** | Son demasiado lentas, frágiles y requieren bases de datos levantadas. Necesitamos pruebas unitarias como primera línea de defensa rápida antes de pensar en E2E. |
| **Jenkins / Azure DevOps para CI** | Añaden una complejidad de infraestructura innecesaria para la etapa actual del proyecto. Requieren configuraciones externas pesadas, mientras que GitHub Actions es gratuito y nativo en nuestro flujo actual. |

---

### Consecuencias

**Lo que gano:**
*   **Consecuencia técnica:** Confianza total al refactorizar. Si modifico algo en la arquitectura y la prueba pasa, sé que no rompí el núcleo del negocio.
*   **Consecuencia sobre el proceso:** Automatización y calidad continua. El pipeline de GitHub Actions actúa como un "cadenero" que rechaza código defectuoso antes de que llegue a producción o a la rama `master`.

**Lo que sacrifico o asumo:**
*   **Limitación técnica:** Las pruebas unitarias no garantizan que el sistema completo funcione (por ejemplo, si falla la conexión a la base de datos, estas pruebas no lo detectarán porque están aisladas).
*   **Deuda o riesgo:** Inversión de tiempo. Escribir y mantener pruebas requiere tiempo extra de desarrollo por cada nueva entidad o regla de negocio que se agregue al sistema.


### Declaración de Uso de IA

En el desarrollo de esta etapa del proyecto el uso de IA se limitó a apoyo con el código, comandos de Git y configuración del archivo YAML la estrategia arquitectónica y la selección de las capas a probar fue pensada por mí.
