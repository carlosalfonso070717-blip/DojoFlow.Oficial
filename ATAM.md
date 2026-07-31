# Evaluación ATAM — DojoFlow

Este documento aplica el método **ATAM** (Architecture Tradeoff Analysis Method) sobre la arquitectura final de DojoFlow, identificando un riesgo, un trade-off y un punto de sensibilidad reales, cada uno justificado con una decisión de arquitectura documentada en la carpeta [`ADRs/`](./ADRs).

Los atributos de calidad considerados para esta evaluación son: **Disponibilidad**, **Costo**, **Seguridad** y **Usabilidad**.

---

## 1. Riesgo

> **Un riesgo es una decisión arquitectónica que, bajo ciertas circunstancias, puede llevar a consecuencias negativas no deseadas.**

### Riesgo identificado: Dependencia de infraestructura fuera del control del proveedor cloud

**Decisión relacionada:** [ADR-08](./ADRs/ADR-08-Carlos-Llanes.md) Despliegue híbrido en AWS + Tailscale, manteniendo PostgreSQL on-premise.

**Descripción:** La disponibilidad completa del sistema ya sea login, alumnos, mensualidades o finanzas depende de que la PC local de la academia esté encendida y con el cliente de Tailscale conectado correctamente. Si la PC se apaga, pierde energía, o el servicio de Tailscale falla, la API en AWS pierde por completo el acceso a la base de datos.

**Evidencia real:** Durante el propio proceso de despliegue de esta unidad, el servicio de Tailscale en la PC local quedó en un estado de bloqueo durante varias horas, dejando el sistema completo sin poder autenticar coaches ni servir datos, a pesar de que la instancia EC2 y el contenedor Docker funcionaban con normalidad.

**Impacto:** Alto. Es una falla de disponibilidad total del núcleo funcional del sistema, sin que exista redundancia ni failover automático.

**Mitigación propuesta:** Documentar un procedimiento de recuperación (reinicio del servicio Tailscale, verificación en el panel de administración `login.tailscale.com`), y evaluar a futuro un servicio de monitoreo simple que notifique cuando el nodo de la PC local aparezca como desconectado.

---

## 2. Trade-off

> **Un trade-off es una decisión que mejora un atributo de calidad a costa de otro.**

### Trade-off identificado: Costo vs. Disponibilidad

**Decisión relacionada:** [ADR-08](./ADRs/ADR-08-Carlos-Llanes.md) — Mantener PostgreSQL local en vez de contratar Amazon RDS.

| Atributo de calidad | Efecto |
| :--- | :--- |
| **Costo** | Mejora significativamente. El costo de infraestructura de base de datos es $0/mes, frente a los ~$15-20/mes mínimos de un Amazon RDS administrado. |
| **Disponibilidad** | Se sacrifica. La disponibilidad del sistema queda atada a un único punto de falla fuera del ecosistema de AWS (la PC local y su conexión a internet doméstica), en vez de la disponibilidad garantizada por el SLA de un servicio administrado en la nube. |

**Justificación de la decisión:** Para el contexto real del proyecto (una academia pequeña, con presupuesto de desarrollo de $0), priorizar Costo sobre Disponibilidad es una decisión consciente y razonable: el sistema no requiere disponibilidad 24/7 de nivel empresarial, y el ahorro es 100% del costo de base de datos. Este mismo trade-off es el que generó el riesgo documentado en la sección 1.

---

## 3. Punto de sensibilidad

> **Un punto de sensibilidad es un parámetro de un componente de arquitectura del cual depende críticamente el logro de un atributo de calidad y un pequeño cambio en ese parámetro produce un cambio significativo en el atributo.**

### Punto de sensibilidad identificado: Presencia (o ausencia) de una IP pública fija en la instancia EC2

**Decisión relacionada:** [ADR-08](./ADRs/ADR-08-Carlos-Llanes.md), sección de consecuencias.

**Descripción:** La **Disponibilidad percibida por el usuario final** (poder abrir `https://dojoflow.club` y que cargue) es altamente sensible a un único parámetro de configuración: si la instancia EC2 tiene o no una **Elastic IP** asignada.

* **Sin Elastic IP (configuración actual):** cada vez que la instancia se detiene y se vuelve a iniciar, AWS le asigna una nueva IP pública. El registro DNS tipo A en Cloudflare sigue apuntando a la IP anterior hasta que se actualiza manualmente, dejando el sitio completamente inalcanzable hasta que se corrige.
* **Con Elastic IP:** la IP pública permanece constante sin importar cuántas veces se detenga o reinicie la instancia, eliminando por completo esa ventana de indisponibilidad a cambio de un pequeño costo adicional mientras la IP no esté asociada a una instancia en ejecución.

**Por qué es un punto de sensibilidad y no solo un riesgo:** A diferencia del riesgo de la sección 1, este es un **parámetro de configuración interno controlable**: cambiar un solo valor modifica directamente y de forma predecible el comportamiento de disponibilidad del sistema ante reinicios de la instancia, sin rediseñar ninguna otra parte de la arquitectura.

**Evidencia real:** Durante esta unidad, la IP pública de la instancia cambió al menos dos veces tras detener/iniciar la instancia (de `3.22.170.235` a `18.191.112.207`), requiriendo actualizar manualmente el secreto `EC2_HOST` en GitHub Actions y el registro DNS en Cloudflare cada vez, con el sitio inaccesible en el intermedio.
