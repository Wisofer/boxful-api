# Boxful API

API en **NestJS** con **MongoDB** para gestión de envíos: usuarios con **JWT**, órdenes (cliente final, paquetes, COD), liquidación automática, **tarifas de envío por día de la semana**, webhook sin token para demos, y export **CSV**.

Si ya programás en Node/React, lo de abajo te alcanza para levantar el proyecto sin dramas.

---

## Qué hacer cuando clonás el repo

1. Tené **Node** (ideal LTS) y **MongoDB** corriendo o una URI de **MongoDB Atlas**.

2. En la carpeta del proyecto:

   ```bash
   npm install
   ```

3. Copiá el ejemplo de variables y editá donde toque:

   ```bash
   cp .env.example .env
   ```

   Abrí `.env` y poné sobre todo **`MONGODB_URI`** (tu base) y **`JWT_SECRET`** (cualquier string largo para dev; la validación pide al menos 16 caracteres).

4. Levantá el servidor:

   ```bash
   npm run dev
   ```

   (Es lo mismo que `npm run start:dev`: Nest en modo watch.)

5. Probá que responda: **`http://localhost:3000/api`** (mensaje tipo “Hello World”) y entrá a la doc interactiva: **`http://localhost:3000/api/docs`**.

Ahí pegás el token en **Authorize** después de hacer login en Swagger o desde tu front.

---

## Scripts que vas a usar

| Comando | Para qué |
|--------|-----------|
| `npm run dev` / `npm run start:dev` | Desarrollo con recarga automática |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Producción (`node dist/main` después del build) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin generar JS |
| `npm test` | Tests unitarios |
| `npm run test:e2e` | Tests e2e (Mongo en memoria; no necesitás Atlas) |
| `npm run backfill:order-locations` | Opcional: rellena `departmentId`/`municipalityId` viejos desde `notes` (necesitás `MONGODB_URI` en el shell) |

---

## Variables `.env`

| Variable | Qué es |
|----------|--------|
| `PORT` | Puerto HTTP (ej. `3000`) |
| `MONGODB_URI` | Connection string Mongo (local o `mongodb+srv://...`) |
| `JWT_SECRET` | Firma del JWT |
| `JWT_EXPIRES_IN` | Vida del token (`7d`, `1h`, etc.) |

El archivo **`.env` no va a GitHub** (está en `.gitignore`): cada dev copia desde **`.env.example`**.

---

## Cómo está armada la carpeta `src/` (resumen)

| Carpeta / archivo | Rol |
|-------------------|-----|
| `main.ts` | Entrada: bootstrap de Nest |
| `app.module.ts` | Módulo raíz: Config, Mongoose (`MONGODB_URI`), módulos de features |
| `app.controller.ts` / `app.service.ts` | Ruta ping de ejemplo bajo `/api` |
| `configure-app.ts` | CORS, Helmet, validación global del body (DTOs), prefijo `/api`, Swagger |
| `config/` | Carga env + esquema **Joi** que valida que no falten variables obligatorias |
| `common/` | Guard JWT, decorator `@CurrentUser()`, tipos/interfaces compartidas, pipes |
| `auth/` | Registro / login → devuelven `access_token` + usuario |
| `users/` | Perfil **`GET /users/me`** protegido con Bearer |
| `orders/` | CRUD de órdenes por usuario, **filtros** en listado, **CSV** mismo criterio de filtro |
| `shipping-rates/` | Precio por **día de la semana** en BD; seed al iniciar si faltan días |
| `liquidation/` | Reglas COD / sin COD sobre `shippingCost` + comisión 0.01% tope USD 25 |
| `webhooks/` | **`POST .../webhooks/orders/status`** sin JWT para simular courier/externo |

Fuera de `src/`: **`test/`** tests e2e y setup de env para Jest · **`scripts/`** utilidades puntual tipo backfill · **`docs/`** guía **`frontend-integration.md`** para quien arma el cliente (URLs, Bearer, ejemplos de body).

---

## Seed automático

Al arrancar, las **tarifas por día** se crean/einsertan si no estaban (`$setOnInsert`). No hace falta un comando aparte solo para tener números de prueba.

---

## Documentación para el front

[**docs/frontend-integration.md**](docs/frontend-integration.md) — rutas con prefijo **`/api`**, headers, payloads, errores típicos, CSV, modelo de orden.

Swagger en vivo cuando el servidor corre: **`/api/docs`**.

---

## Licencia

`UNLICENSED` / uso privado según el repo.
