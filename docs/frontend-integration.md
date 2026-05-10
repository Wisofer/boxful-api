Esta guía está pensada para desarrolladores que consumen esta API desde un navegador u otra aplicación cliente. Es complementaria de **Swagger** (`/api/docs` cuando el servidor corre en local).

---

## Base URL

Por defecto (variables de ejemplo en `.env.example`):

| Entorno | Base URL típica |
|---------|------------------|
| Local desarrollo | `http://localhost:3000/api` |

Todas las rutas documentadas abajo son **relativas a** `/api` (prefijo global de Nest).

**Ejemplo:** registrar usuario → `POST http://localhost:3000/api/auth/register`

---

## Headers generales

| Cuándo | Header | Valor |
|--------|--------|--------|
| Casi todas las peticiones JSON | `Content-Type` | `application/json` |
| Rutas **protegidas** | `Authorization` | `Bearer <access_token>` |

El token lo devuelve **`POST /auth/login`** en el campo **`access_token`**.

---

## Swagger en vivo

Con el proyecto en marcha (`npm run start:dev`):

- Documentación interactiva: **`http://localhost:<PORT>/api/docs`**
- Ahí puedes usar **Authorize** (`JWT-auth`) pegando: `Bearer eyJhbG...` o solo el token, según cómo esté configurado el cliente de Swagger (suele esperar solo el token después de elegir Bearer).

---

## Flujo de autenticación

1. **`POST /auth/register`** o **`POST /auth/login`** → recibes `access_token` y `user`.
2. Guarda el token de forma segura según tu stack (por ejemplo memoria + refresh en memoria, `sessionStorage` para apps web de prueba; **no** lo subas a repos).
3. Para cada petición autenticada, envía **`Authorization: Bearer <access_token>`**.
4. Si el token expiró o es inválido → **401** → vuelve a **login** y actualiza el token.
5. Opcional: **`GET /users/me`** después de cargar la app para confirmar que el token sigue válido y refrescar datos de usuario en pantalla.

---

## Cómo conectar el frontend (resumen práctico)

### Login

1. `POST /api/auth/login` con body JSON `email` y `password`.
2. Lee `access_token` de la respuesta.
3. Guarda el token donde tu app lo necesite (estado global, store, etc.).

### Dónde guardar el token

- **SPA en prueba técnica:** `sessionStorage` o estado en memoria es aceptable; evita `localStorage` si te preocupa XSS (decisión de tu equipo).
- **Mobile / native:** almacenamiento seguro del SO (Keychain, Keystore, etc.) en producción.

### Cómo enviar Bearer

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

En `fetch`:

```javascript
fetch(`${API}/orders`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});
```

### Cómo descargar el CSV

El endpoint devuelve **texto CSV**, no JSON. Usa `GET` con los mismos query params que el listado y el header `Authorization`.

En el navegador puedes abrir la URL con el token solo en entornos controlados; en producción suele hacerse con `fetch` + `blob` + enlace de descarga, o dejando que el usuario use “Guardar como” desde una ventana autenticada según tu arquitectura.

Ejemplo mínimo con `fetch`:

```javascript
const qs = new URLSearchParams({ status: 'DELIVERED' });
const res = await fetch(`${API}/orders/export/csv?${qs}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'orders.csv';
a.click();
URL.revokeObjectURL(url);
```

### Cómo manejar 401

- Trata **401 Unauthorized** como “sesión inválida o expirada”.
- Limpia el token del cliente, redirige a login y opcionalmente muestra un mensaje amigable.
- No reintentes infinitamente la misma petición con el mismo token.

---

## Modelos importantes (conceptual)

Estos son los **conceptos** que verás en JSON; los nombres de campos coinciden con los de la API.

### User (`user` en auth y en `/users/me`)

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | string | ObjectId en hex |
| `name` | string | |
| `email` | string | |

La contraseña **nunca** se devuelve.

### Package (dentro de `packages[]` en una orden)

Línea de paquete embebida en la orden.

| Campo | Tipo |
|-------|------|
| `description` | string |
| `weight`, `height`, `width`, `length` | number (≥ 0) |
| `quantity` | entero ≥ 1 |

### Order

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | string | |
| `customerName`, `customerPhone`, `customerAddress` | string | Destinatario |
| `departmentId`, `municipalityId` | string | Ids del catálogo (mismos que el formulario). Cadena vacía si la orden es antigua o no se enviaron al crear. |
| `notes` | string | |
| `status` | `"PENDING"` \| `"IN_TRANSIT"` \| `"DELIVERED"` \| `"CANCELLED"` | |
| `isCOD` | boolean | Contra reembolso |
| `expectedAmount` | number | Monto esperado (COD); puede usarse como base provisional si no hay cobro registrado |
| `collectedAmount` | number | Cobrado de verdad; si COD y mayor que 0, prima sobre `expectedAmount` en cálculos |
| `shippingCost` | number | Según tarifa **del día actual del servidor** al crear/actualizar |
| `commission` | number | Solo COD con dinero recolectado; regla 0.01 % con tope (ver backend / PDF) |
| `liquidationAmount` | number | Resultado de liquidación para el comercio (reglas COD / no COD del backend) |
| `packages` | Package[] | Mínimo 1 al crear |
| `createdAt`, `updatedAt` | string ISO 8601 | |

**No necesitas enviar** `shippingCost`, `commission` ni `liquidationAmount` al crear/editar orden: el servidor los calcula.

### COD (Cash on delivery)

- **`isCOD: true`** activa las reglas de comisión y liquidación COD.
- El **recolectado real** puede llegar después vía webhook o por actualización de orden; hasta entonces pueden usarse valores provisionales (`expectedAmount` / `collectedAmount`).

### Liquidation

No es un endpoint aparte en esta API: **`liquidationAmount`** viene ya calculado **en cada orden**. La lógica vive centralizada en el backend (`LiquidationService`).

### Shipping cost

Tampoco lo fija el cliente: **`shippingCost`** se obtiene de la tabla de tarifas por **día de la semana** al persistir cambios relevantes.

---

## Endpoints (referencia rápida)

Convenciones de errores comunes Nest + class-validator:

- **400** – body o query mal formados (ej. campo extra no permitido, email inválido, validación Numérico/rango).
- **401** – sin token o JWT inválido/expirado.
- **403** – autenticado pero sin permiso para ese recurso (ej. orden de otro usuario).
- **404** – recurso no encontrado u ObjectId válido pero inexistente.
- **409** – conflicto (ej. email ya registrado).

El cuerpo de error suele lucir así:

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

---

### AUTH — `POST /auth/register`

| | |
|---|---|
| **Auth** | No |
| **Body** | `RegisterDto` |

**Body ejemplo:**

```json
{
  "name": "Ana Martínez",
  "email": "ana@ejemplo.com",
  "password": "secreta123"
}
```

**Respuesta 201**

```json
{
  "user": {
    "id": "674a1234567890abcdef1234",
    "name": "Ana Martínez",
    "email": "ana@ejemplo.com"
  }
}
```

**Errores:** `400` validación · `409` email duplicado.

---

### AUTH — `POST /auth/login`

| | |
|---|---|
| **Auth** | No |
| **Body** | `LoginDto`: `email`, `password` (mínimo 6 caracteres) |

**Body ejemplo:**

```json
{
  "email": "ana@ejemplo.com",
  "password": "secreta123"
}
```

**Respuesta 200**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "674a1234567890abcdef1234",
    "name": "Ana Martínez",
    "email": "ana@ejemplo.com"
  }
}
```

**Errores:** `400` · `401` credenciales incorrectas.

---

### USERS — `GET /users/me`

| | |
|---|---|
| **Auth** | **Sí** Bearer |
| **Query** | Ninguno |

**Request ejemplo:**

```http
GET /api/users/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta 200**

```json
{
  "user": {
    "id": "674a1234567890abcdef1234",
    "name": "Ana Martínez",
    "email": "ana@ejemplo.com"
  }
}
```

**Errores:** `401`.

---

### ORDERS — `GET /orders`

| | |
|---|---|
| **Auth** | Sí Bearer |
| **Query (todos opcionales)** | `status`, `isCOD`, `customerName`, `startDate`, `endDate` |

Los filtros tienen la misma semántica que en CSV.

**Ejemplo:** órdenes entregadas, COD:

```http
GET /api/orders?status=DELIVERED&isCOD=true HTTP/1.1
Authorization: Bearer <token>
```

`isCOD` en query debe ser **`true`** o **`false`** (cadena interpretada como booleano).

**Respuesta 200:** array de órdenes (más recientes primero por `createdAt`).

---

### ORDERS — `GET /orders/export/csv`

| | |
|---|---|
| **Auth** | Sí Bearer |
| **Query** | Igual que `GET /orders` |

**Respuesta:** `200`, cuerpo **text/csv**.

**Headers de respuesta importantes:**

- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="orders.csv"`

Errores: `400` filtros invalidados · `401`.

---

### ORDERS — `POST /orders`

| | |
|---|---|
| **Auth** | Sí Bearer |
| **Body** | Ver `CreateOrderDto` |

**Body ejemplo:**

```json
{
  "customerName": "Laura Gómez",
  "customerPhone": "+52 5512345678",
  "customerAddress": "Av. Reforma 123, Ciudad",
  "departmentId": "06",
  "municipalityId": "0601",
  "notes": "Tocar timbre dos veces",
  "isCOD": true,
  "expectedAmount": 500,
  "collectedAmount": 0,
  "packages": [
    {
      "description": "Electrónica",
      "weight": 2,
      "height": 30,
      "width": 20,
      "length": 40,
      "quantity": 1
    }
  ]
}
```

**Respuesta 201:** objeto orden serializado completo (`shippingCost`, `commission`, `liquidationAmount` ya calculados).

**Errores:** `400` · `401`.

---

### ORDERS — `GET /orders/:id`

| | |
|---|---|
| **Auth** | Sí Bearer |
| **Parámetro** | `id` Mongo ObjectId |

**Ejemplo:** `GET /api/orders/674babcdef1234567890abcd`

**Respuesta 200:** una orden.

**Errores:** `400` si `id` no es ObjectId válido · `404` si no existe · `403` si no es del usuario · `401`.

---

### ORDERS — `PATCH /orders/:id`

| | |
|---|---|
| **Auth** | Sí Bearer |
| **Body** | Partial de campos permitidos (**no** envías `shippingCost`/comisión/liquidación; se recalculan al guardar) |

Ejemplo cambiar estado y recolectado:

```json
{
  "status": "IN_TRANSIT",
  "collectedAmount": 498.5
}
```

Si envías `packages`, debe ser el **arreglo completo** (mínimo 1 ítem).

**Respuesta 200:** orden actualizada.

**Errores:** `400` · `401` · `403` · `404`.

---

### ORDERS — `DELETE /orders/:id`

| | |
|---|---|
| **Auth** | Sí Bearer |

**Respuesta 204:** sin cuerpo.

**Errores:** `401` · `403` · `404`.

---

### WEBHOOKS — `POST /webhooks/orders/status`

Integración **simulada** (carrier / pasarela). **No lleva JWT.** En el frontend normalmente **no** lo llamas; sirve para pruebas o Postman.

| | |
|---|---|
| **Auth** | No |
| **Body** | `OrderStatusWebhookDto` |

```json
{
  "orderId": "674babcdef1234567890abcd",
  "status": "DELIVERED",
  "collectedAmount": 15
}
```

- `collectedAmount` opcional; si viene, debe ser **estrictamente mayor que 0**.
- Actualiza orden, opcionalmente el cobrado real, recalcula finanzas (misma regla que en patch interno).

**Respuesta 200:**

```json
{
  "message": "Webhook processed successfully",
  "order": {
    "...": "misma forma que GET /orders/:id"
  }
}
```

**Errores:** `400` validación/ObjectId · `404` orden inexistente.

---

## Seed automático (tarifas envío)

Al arrancar el backend, si faltan documentos por día en la colección de shipping rates, se crean valores por defecto (upsert). No necesitas ejecutar scripts manuales para tener una tabla usable en local.

---

## Checklist rápido antes de integrar

1. Variables `.env`: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`.
2. Mongo corriendo y accesible con esa URI.
3. `npm run start:dev`
4. Probar Swagger `http://localhost:<PORT>/api/docs`
5. Login → copiar token → Authorize → probar órdenes.

Si algo no coincide con esta guía pero sí con Swagger, **prioriza comportamiento real** y abre una issue interna para alinear texto.
