# ADR-05: Implementación de Patrones GOF (Builder y Strategy) para Registro y Cotizaciones

| Campo  | Valor |
|--------|-------|
| Autor  | Carlos Alfonso Llanes Rodriguez |
| Fecha  | 24/06/2026 |
| Estado | `Aceptado` |

---

## Contexto

DojoFlow necesita registrar peleadores en el sistema asegurando la integridad de sus datos y calcular dinámicamente la mensualidad que deben pagar. La academia ofrece 5 disciplinas (MMA, Boxeo, Kickboxing, Judo, JiuJitsu) y un esquema de promociones donde el costo varía según la cantidad de disciplinas contratadas (ej. 1 por $850, 2 por $1500, 5 por $4000). Hacer estas validaciones y cálculos de precio directamente en el controlador o mediante múltiples sentencias condicionales generaría un código frágil, difícil de escalar y violaría los principios SOLID de nuestra Arquitectura Hexagonal.

---

## Decisión

Se decidió implementar dos Patrones de Diseño GOF de categorías distintas en la capa de Dominio:

1. **Patrón Builder (Creacional):** Implementado en la entidad `Alumno`.
2. **Patrón Strategy (De Comportamiento):** Implementado mediante la interfaz `ICalculoMensualidadStrategy` y la clase de contexto `CalculadoraMensualidad`.

### ¿Por qué?

* **Builder:** Resuelve el problema de inicializar un objeto complejo. En un endpoint HTTP, los datos llegan mediante un DTO. El Builder nos permite ir "armando" al alumno paso a paso (`ConNombre`, `ConTelefono`, `ConDisciplinas`) y, mediante su método final `Build()`, aplicar las reglas de negocio estrictas antes de instanciar el objeto real.
* **Strategy:** Resuelve el cálculo de los precios multidisplina cumpliendo el principio *Open/Closed*. En lugar de un método con 5 `if/else`, cada esquema de cobro es una clase separada (`PrecioIndividualStrategy`, `PrecioDobleStrategy`, etc.). El contexto simplemente inyecta la estrategia correcta según el tamaño del arreglo de disciplinas seleccionado por el cliente.

### Alternativas consideradas

| Alternativa | Por qué la descarté |
|-------------|---------------------|
| Constructores Telescópicos y anidación de `if/else` | Rompe el principio Abierto/Cerrado (OCP). Cada vez que el dojo cambie sus precios o agregue disciplinas, habría que modificar y arriesgar la clase principal. |
| Patrón Factory Method (Creacional) | Solo delega la creación, pero no es tan flexible como el Builder para armar objetos con propiedades opcionales paso a paso provenientes de un JSON. |
| Patrón State (Comportamiento) | El precio no depende del "estado interno" del alumno a lo largo del tiempo, sino de un cálculo aislado basado en su selección de carrito/paquete al momento de registrarse. |

---

## Consecuencias

**✅ Lo que gano:**

* **Técnica:** El sistema es altamente escalable. Si el dojo lanza un paquete nuevo para niños o familias, solo se debe crear una nueva clase `Strategy` sin tocar el código existente.
* **Proceso / Equipo:** Al estar las reglas de negocio separadas en pequeñas estrategias y builders, es mucho más sencillo y rápido escribir pruebas unitarias (Unit Tests) aisladas para cada cálculo.

**⚠️ Lo que sacrifico o asumo:**

* **Limitación técnica:** Se incrementa la verbosidad y la cantidad de archivos/interfaces en el proyecto para resolver un problema que inicialmente parecía pequeño.
* **Deuda o riesgo:** Si en el futuro los precios dependen de combinaciones muy complejas (ej. "3 disciplinas + un cupón de descuento + ser estudiante universitario"), el patrón Strategy podría quedarse corto y tendríamos que refactorizar e incorporar un patrón `Decorator`.

---

## Diagrama

flowchart TB
    subgraph API [DojoFlow.API - Capa de Presentación]
        Swagger[Interfaz Swagger UI Custom] -->|Envía JSON| Ctrl[AlumnosController]
        Request[RegistrarAlumnoRequest DTO] -.->|Moldea datos| Ctrl
    end

    subgraph APP [DojoFlow.Application - Capa de Aplicación]
        Ctrl -->|Invoca flujo| UC[RegistrarAlumnoUseCase]
        Port[IAlumnoRepository Puerto / Interfaz] -.->|Define contrato| UC
    end

    subgraph DOM [DojoFlow.Domain - Núcleo del Sistema]
        UC -->|1. Solicita creación paso a paso| Builder[Alumno.Builder]
        Builder -->|Construye de forma segura| Entity[Entidad: Alumno]
        
        UC -->|2. Solicita cotización por volumen| Calc[CalculadoraMensualidad Contexto]
        Calc -->|Elegible según cantidad| Strategy[ICalculoMensualidadStrategy]
        
        Strategy <|-- S1[PrecioIndividualStrategy $850]
        Strategy <|-- S2[PrecioDobleStrategy $1500]
        Strategy <|-- S3[PrecioFullAcademyStrategy $4000]
    end

    subgraph INFRA [DojoFlow.Infrastructure - Capa de Infraestructura]
        Adapter[InMemoryAlumnoRepository Adaptador] --->|Implementa| Port
        UC -->|3. Envía para persistencia| Port
        Port --->|Guarda en memoria RAM| Adapter
    end

    %% Estilos estéticos para diferenciar las capas de la arquitectura
    classDef apiLayer fill:#eef2f7,stroke:#0056b3,stroke-width:2px,color:#000;
    classDef appLayer fill:#f0fbf4,stroke:#1e7e34,stroke-width:2px,color:#000;
    classDef domLayer fill:#fff9db,stroke:#d39e00,stroke-width:2px,color:#000;
    classDef infraLayer fill:#fdf2f2,stroke:#bd2130,stroke-width:2px,color:#000;

    class Swagger,Ctrl,Request apiLayer;
    class UC,Port appLayer;
    class Builder,Entity,Calc,Strategy,S1,S2,S3 domLayer;
    class Adapter infraLayer;

---

## Declaración de Uso de IA

En cumplimiento con los lineamientos de entrega, se declara que se utilizaron herramientas de Inteligencia Artificial (LLMs) como asistencia en el desarrollo. Su uso se limitó a sugerencias para el mapeo de los patrones Builder y Strategy en C# y ajustes de formato Markdown. El diseño arquitectónico, la definición de las reglas de negocio de los descuentos del dojo, las propiedades de la entidad y la toma de decisiones descrita en este documento fueron desarrollados en su totalidad por el autor.
