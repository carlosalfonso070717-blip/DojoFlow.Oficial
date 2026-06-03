# ADR-01: DojoFlow

| Campo  | Valor |
|--------|-------|
| Autor  | Carlos Llanes |
| Fecha  | 17/07/2007 |
| Estado | `Propuesto`|

---

## Contexto

Estoy construyendo DojoFlow, un sistema de gestión personalizada para mi academia de kickboxing Dominio Combat Club. El objetivo es centralizar el control de alumnos, membresías e inventario de venta eliminando así el uso de libretas físicas para hacer este trabajo. Como se trata de un proyecto para mi materia de Arquitectura de Software con un tiempo de desarrollo de 4 meses en .NET, requiero una estructura que me permita escalar el sistema y realizar pruebas sin afectaciones a la lógica del negocio.

## Decisión

Arquitectura Hexagonal (Ports and Adapters)

### ¿Por qué?

Basándome en ejemplos ya creados e investgaciones sobre proyectos como el mío, me di cuenta que este patrón es el más adecuado para mi sistema porque considero que necesita alta testabilidad y una separación entre lógica del club y las opciones externas.
En Dominio, las reglas de quién puede o no entrenar deben ser independientes de si usamos una base de datos relacional o una interfaz web. La Hexagonal me permite que el núcleo de mi app sea inmune a cambios externos.
### Alternativas consideradas


| Alternativa | Por qué la descarté |
|-------------|---------------------|
| MVC        |   Se utiliza principalmente para apps web tradicionales donde la lógica suele quedar muy amarrada al servidor, dificultando las pruebas independientes.             |
| MVVM        | Es ideal para aplicaciones de escritorio o móviles pero no ofrece el modelo robusto que requiere un buen backend empresarial.                 |
| MVP         | Se enfoca en aplicaciones móviles donde la interfaz es un poco "tonta" o tiene muy poca lógica lo cual no es para nada el caso de mi sistema.               |

---

## Consecuencias

**✅ Lo que gano:**

**Técnica:** Obtengo una alta testabilidad. Puedo checar que el sistema de cobros de Dominio funciona bien mediante pruebas sin necesidad de encender la base de datos o la página web.
**Proceso:** El desarrollo es más ordenado porque me obliga a definir interfaces claras para cada función del gimnasio

**⚠️ Lo que sacrifico o asumo:**

**Limitación Técnica:** El inicio del proyecto requiere crear más archivos y carpetas para separar los puertos de los adaptadores.
**Deuda o riesgo:** Existe el riesgo de aumentar la complejidad si no se respeta la jerarquía de las capas desde el primer mes de desarrollo del proyecto.

## Diagrama

<img width="1280" height="960" alt="WhatsApp Image 2026-05-13 at 8 10 09 PM" src="https://github.com/user-attachments/assets/728985d8-bb4e-4d9b-9a69-6669f87cfd2e" />

