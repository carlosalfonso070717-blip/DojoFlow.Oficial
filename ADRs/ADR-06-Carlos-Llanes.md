# ADR: Refactorización y Mejora de la Arquitectura Backend de DojoFlow

## Contexto
Durante el desarrollo del backend de DojoFlow, se detectó una acumulación de deuda técnica en los controladores, caracterizada por métodos monolíticos que violaban principios fundamentales de diseño de software como Responsabilidad Única y Acoplamiento. Se decidió aplicar la técnica de refactorización *Extract Method* para mejorar la legibilidad y mantenibilidad del sistema.

---

## 1. Deuda Técnica #1: Acoplamiento entre Controladores y Estado Global
* **Qué es:** El controlador `AsistenciasController` dependía directamente de listas estáticas (`_baseDeDatosEnMemoria` y `_tablaMensualidades`) pertenecientes a otros controladores (`AlumnosController`, `MensualidadesController`).
* **Por qué existe:** Se priorizó la rapidez de acceso a los datos durante la fase de prototipado inicial, evitando la configuración de una capa de acceso a datos formal o una base de datos persistente.
* **Costo de no pagarla:** Alto riesgo de errores en tiempo de ejecución (bugs de sincronización) y dificultad extrema para escalar o probar el código de forma aislada, ya que un controlador está "amarrado" a la implementación interna de otro.
* **Propuesta de solución:** Aplicar el patrón de Abstracción de Datos. Refactorizar para centralizar el acceso a datos y, a largo plazo, migrar hacia un patrón de Repositorio que desacople el controlador de la estructura de las listas en memoria.

## 2. Deuda Técnica #2: Métodos Monolíticos en Controladores (Fat Controllers)
* **Qué es:** El método `RegistrarAsistencia` concentraba validaciones, búsqueda de datos, lógica financiera y construcción de la respuesta HTTP, superando las buenas prácticas de diseño de métodos cortos y especializados.
* **Por qué existe:** Descuido técnico por crecimiento orgánico; la lógica se fue agregando al controlador conforme se requerían nuevas funcionalidades sin detenerse a modularizar el código.
* **Costo de no pagarla:** El código se vuelve "frágil". Cualquier pequeño cambio en la lógica financiera requiere tocar el controlador principal, aumentando drásticamente la probabilidad de introducir errores en funcionalidades que deberían ser independientes.
* **Propuesta de solución:** Aplicar Extract Method. Se descompuso el método `RegistrarAsistencia` en métodos privados (`EsPinValido`, `BuscarAlumnoPorPin`, `ObtenerEstatusFinanciero`, `ConstruirRespuestaDeAcceso`). Esto permite que el método principal actúe solo como un orquestador, cumpliendo con el Principio de Responsabilidad Única.

---

## Declaración de uso de IA
Para la redacción técnica de este documento y el análisis de los *code smells* detectados en la estructura de los controladores (acoplamiento estático y métodos extendidos), se utilizó asistencia de inteligencia artificial (Gemini) con el objetivo de estructurar el ADR bajo estándares profesionales de ingeniería.
