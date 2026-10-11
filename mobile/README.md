# DojoFlow Mobile 📱

App nativa (Android / iOS / tablet) de DojoFlow, construida con **React Native + Expo + TypeScript + Expo Router**.
Es un adaptador de entrada más de la arquitectura hexagonal: consume la misma API REST que el frontend web.

## Pantallas

| Ruta | Descripción | Requiere sesión |
|------|-------------|-----------------|
| `login` | Inicio de sesión del coach (JWT guardado en SecureStore) | No |
| `registro` | Alta de coach: verificación de correo por PIN + código de invitación | No |
| `recuperar` | Restablecer contraseña con PIN enviado por correo | No |
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
└── theme.ts        # Colores (mismos que el frontend web), claro/oscuro
```

## Nota sobre npm 11

`npx expo install` falla con npm 11.17 (`EALLOWSCRIPTS`). Mientras se corrige, instala paquetes con la versión que marca Expo:

```bash
node -p "require('expo/bundledNativeModules.json')['<paquete>']"
npm install <paquete>@<versión>
```
