# DojoFlow Mobile 📱

App nativa (Android / iOS / tablet) de DojoFlow, construida con **React Native + Expo + TypeScript + Expo Router**.
Es un adaptador de entrada más de la arquitectura hexagonal: consume la misma API REST que el frontend web.

## Pantallas

| Ruta | Descripción | Requiere sesión |
|------|-------------|-----------------|
| `login` | Inicio de sesión del coach (JWT guardado en SecureStore) | No |
| `registro` | Alta de coach: verificación de correo por PIN + código de invitación | No |
| `recuperar` | Restablecer contraseña con PIN enviado por correo | No |
| `registro/planes` | Elección de plan (Gestiona, Plus, Premium; mensual o anual) | Cuenta recién creada |
| `registro/pago` | Pasarela de pago **simulada** (modo de prueba, ver `src/suscripciones/`) | Cuenta recién creada |
| `kiosco` | Registro de asistencia con PIN de 5 dígitos (tablet de recepción) | No |
| `(app)/index` | Lista de alumnos con búsqueda y baja | Sí |
| `(app)/registrar` | Alta de peleador con disciplinas | Sí |
| `(app)/mensualidades` | Recibos con filtro por estado y registro de pago | Sí |
| `(app)/inventario` | Alertas de stock (Observer), alta, edición, venta y baja de artículos | Sí |
| `(app)/finanzas` | Resumen del mes e historial mensual | Sí |

## Correr en tu celular

```bash
cd mobile
npm install
npx expo start
```

Escanea el QR con **Expo Go** (Android) o la cámara (iOS). Por defecto apunta a producción: `https://dojoflow.club/api`.

Para usar una API local cambia `expo.extra.apiUrl` en `app.json` (p. ej. `http://192.168.1.50:5000/api`).

## Estructura

```
src/
├── app/            # Rutas (Expo Router): cada archivo es una pantalla
├── api/            # Cliente HTTP (token Bearer automático) y endpoints
├── auth/           # Contexto de sesión
├── components/     # UI reutilizable
├── suscripciones/  # Planes, validación de tarjetas y pasarela de pago (hoy simulada)
└── theme.ts        # Colores (mismos que el frontend web), claro/oscuro
```

### Pagos (mockup listo para reglas de negocio)

`src/suscripciones/` separa el catálogo (`catalogo.ts`), la validación de tarjetas (`tarjeta.ts`),
el puerto de la pasarela (`pasarela.ts`) y el caso de uso `contratarPlan` (`servicio.ts`).
Para conectar una pasarela real basta con escribir un adaptador de `Pasarela` (que tokenice la tarjeta
con el SDK del proveedor) y asignarlo en `pasarela.ts`; la activación del plan pasa a la API en `servicio.ts`.
Tarjetas de prueba: `4242 4242 4242 4242` (aprobada) y `4000 0000 0000 0002` (rechazada).

## Nota sobre npm 11

`npx expo install` falla con npm 11.17 (`EALLOWSCRIPTS`). Mientras se corrige, instala paquetes con la versión que marca Expo:

```bash
node -p "require('expo/bundledNativeModules.json')['<paquete>']"
npm install <paquete>@<versión>
```
