# ADR-09: Despliegue híbrido en la nube (AWS + Docker) manteniendo la base de datos on-premise

| Campo  | Valor |
|--------|-------|
| Autor  | Carlos Llanes |
| Fecha  | 30/07/2026 |
| Estado | `Aceptado`|

---

### 🔗 Contexto

Necesitaba que DojoFlow fuera accesible desde internet (no solo desde la red local de la academia), para poder administrar el club desde cualquier lugar y hacer demos del proyecto. Sin embargo, no tengo presupuesto para pagar un servicio de base de datos administrado en la nube (como Amazon RDS), mientras que sí cuento con una PC en la academia que puede quedarse encendida con PostgreSQL corriendo localmente. El reto arquitectónico era exponer la API y el frontend en internet sin exponer directamente mi base de datos local a la red pública, lo cual sería un riesgo de seguridad grave.

### Decisión

Adoptar una **arquitectura de despliegue híbrida**: la API de DojoFlow (junto con el frontend, servido como archivos estáticos desde el mismo contenedor) se despliega en un contenedor **Docker** sobre una instancia **EC2** de AWS, mientras que **PostgreSQL permanece corriendo en mi PC local**. La comunicación entre la EC2 y la PC se realiza mediante una **VPN de malla (Tailscale)**, que crea un túnel privado punto a punto sin necesidad de abrir puertos públicos hacia la base de datos. El pipeline de **GitHub Actions** ya existente (ADR-07) se extendió para construir la imagen Docker, subirla a **Amazon ECR**, y desplegarla por SSH en la instancia EC2 en cada push a la rama `deploy`.

### ¿Por qué?

Descarté pagar por una base de datos administrada porque el presupuesto del proyecto es $0 y ya tengo el hardware necesario en la propia PC de la academia. Elegí Tailscale sobre otras VPN porque no requiere configurar ni exponer un servidor VPN propio: cada dispositivo (la EC2 y mi PC) se autentica contra la red de Tailscale y automáticamente se ven entre sí mediante IPs privadas de un rango dedicado (`100.x.x.x`), sin tocar el enrutador de mi casa ni abrir el puerto 5432 de Postgres a internet. Contenerizar la API con Docker me permite que el entorno de ejecución sea idéntico entre mi máquina de desarrollo y la instancia EC2, evitando el clásico "en mi máquina sí funciona".

### Alternativas consideradas

| Alternativa | Por qué la descarté |
| :--- | :--- |
| **Amazon RDS (PostgreSQL administrado)** | Es la opción más robusta, pero tiene un costo mensual fijo que no puedo cubrir en esta etapa del proyecto; además ya tengo el hardware disponible en la academia. |
| **Exponer PostgreSQL directamente a internet (puerto 5432 público)** | Es la solución más simple técnicamente, pero representa un riesgo de seguridad inaceptable: expondría mi base de datos completa a escaneos y ataques de fuerza bruta constantes desde cualquier parte del mundo. |
| **Desplegar todo (API + BD) en la misma EC2** | Elimina la necesidad de una VPN, pero me obliga a pagar/mantener el almacenamiento y los backups de la base de datos en la nube, perdiendo la ventaja de costo $0 de usar mi propio hardware. |

---

### Consecuencias

**Lo que gano:**
* **Consecuencia técnica:** El sistema es accesible desde cualquier parte del mundo por internet, sin exponer jamás la base de datos a una IP pública — solo es visible dentro de la red privada de Tailscale.
* **Consecuencia sobre el proceso:** El costo de infraestructura se mantiene prácticamente en $0 (la instancia EC2 cae dentro de la capa gratuita de AWS), lo cual es viable para el presupuesto real del proyecto.

**Lo que sacrifico o asumo:**
* **Limitación técnica:** La disponibilidad del sistema completo depende de que mi PC local esté encendida y con Tailscale conectado; si se apaga o pierde conexión, el frontend carga pero el login y los datos dejan de funcionar. Esto es un **riesgo de disponibilidad** aceptado conscientemente a cambio de costo $0.
* **Deuda o riesgo:** Al no usar una IP elástica en la EC2 (para evitar su costo), la IP pública cambia cada vez que detengo y vuelvo a iniciar la instancia, obligándome a actualizar manualmente el registro DNS en Cloudflare y el secreto `EC2_HOST` de GitHub Actions después de cada reinicio.

### Declaración de Uso de IA

Usé IA como apoyo para redactar el `Dockerfile`, el workflow de GitHub Actions, diagnosticar errores de conexión (contraseña de Postgres, autenticación de Npgsql, configuración de `pg_hba.conf`) y para investigar opciones de DNS dinámico. La decisión de arquitectura híbrida en sí (mantener la base de datos local en vez de pagar un servicio administrado, y usar una VPN de malla en vez de exponer el puerto directamente) fue mía, evaluando mi presupuesto real y mis prioridades de seguridad.
