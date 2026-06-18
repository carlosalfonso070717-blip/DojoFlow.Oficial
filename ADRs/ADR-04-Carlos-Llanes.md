# ADR-03: Implementación de API REST para comunicación de DojoFlow

| Campo  | Valor |
|--------|-------|
| Autor  | Carlos Llanes |
| Fecha  | 18/06/2026 |
| Estado | `Propuesto` |

---

## Contexto

DojoFlow es el sistema de gestión para Dominio Combat Club, construido bajo una Arquitectura Hexagonal en .NET 10. El núcleo del sistema (los casos de uso de cobros, asistencia y membresías) necesita una forma de comunicarse con el exterior, específicamente con las tablets ubicadas en la recepción y con futuros paneles web administrativos. Por las restricciones académicas y de tiempo del proyecto, se requiere una solución de comunicación que sea el estándar de la industria, fácil de probar de forma aislada y que permita generar documentación autogenerada para evaluación del profesor.

---

## Decisión

Implementar una API REST utilizando ASP.NET Core Web API como adaptador de entrada.

### ¿Por qué?

REST utiliza el protocolo HTTP y verbos estándar (GET, POST, PUT, DELETE), lo cual es un formato universalmente entendido por cualquier cliente web o móvil. Elegí esta arquitectura de comunicación porque ASP.NET Core proporciona un entorno nativo y muy fuerte para exponer nuestros casos de uso mediante controladores. Además, la arquitectura REST permite una integración inmediata y nativa con herramientas como Swagger, lo cual me permite probar y documentar los endpoints directamente desde el navegador, cumpliendo con las exigencias del proyecto y la industria.

### Alternativas consideradas

| Alternativa | Por qué la descarté |
|-------------|---------------------|
| GraphQL | Añade una complejidad innecesaria para un dojo. Los clientes realizarán peticiones predecibles como marcar asistencia o consultar un alumno. No necesitamos la flexibilidad extrema de consultar grafos de datos que GraphQL ofrece, lo cual solo retrasaría el desarrollo. |
| gRPC | Aunque ofrece una comunicación extremadamente rápida, está diseñado principalmente para comunicación interna entre microservicios. Para consumirlo desde una aplicación web o tablet requeriría configuraciones adicionales, rompiendo la simplicidad que busco. |
| SOAP | Es un protocolo heredado que usa archivos XML muy pesados y es difícil de implementar en comparación con la ligereza y legibilidad del formato JSON que utilizaremos de forma nativa en REST. |

---

## Consecuencias

**Lo que gano:**

- **Consecuencia técnica:** Interoperabilidad total ya que ualquier dispositivo con conexión a internet en el club podrá conectarse al sistema enviando un simple archivo JSON, sin importar en qué lenguaje esté programada la pantalla que vea el usuario.
- **Consecuencia sobre el proceso:** Desarrollo paralelo e independiente porque al definir los endpoints y documentarlos con Swagger, las reglas del negocio quedan claras. Si en un futuro se requiere construir una app móvil para el club, se puede hacer solo con guiarse por la documentación de la API.

**Lo que sacrifico o asumo:**

- **Limitación técnica:** *Over-fetching* o *Under-fetching*. Al usar REST, las respuestas de los endpoints son fijas. Podríamos estar enviando todo el historial de un alumno cuando la tablet de recepción solo necesitaba saber si su estatus está "Activo", consumiendo un poco más de ancho de banda de lo estrictamente necesario.
- **Deuda o riesgo:** Versionamiento. Si en el futuro las reglas de negocio de Dominio Combat Club cambian drásticamente, tendré que implementar un sistema de versiones en las rutas de la API como `/api/v1/alumnos` vs `/api/v2/alumnos` para no romper las aplicaciones cliente antiguas que sigan en uso.

## Diagrama

<img width="665" height="152" alt="image" src="https://github.com/user-attachments/assets/555fee02-829b-4087-aff5-5a85f473191b" />
