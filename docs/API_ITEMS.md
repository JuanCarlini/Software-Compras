# API Items - Documentación de Endpoints

## Base URL
`/api/items`

---

## Endpoints Disponibles

### 1. **GET /api/items**
Obtener todos los items activos (o todos según query params)

**Query Parameters:**
- `includeInactive` (boolean, opcional): Si es `true`, incluye items inactivos
- `categoria` (string, opcional): Filtra items por categoría específica

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "nombre": "Cemento Portland",
    "descripcion": "Cemento tipo Portland 50kg",
    "precio_sugerido": 1500.00,
    "unidad_medida": "bolsas",
    "categoria": "Materiales",
    "is_active": true,
    "created_by": 1,
    "created_at": "2025-11-19T10:00:00Z",
    "updated_at": "2025-11-19T10:00:00Z"
  }
]
```

**Ejemplos:**
```bash
GET /api/items
GET /api/items?includeInactive=true
GET /api/items?categoria=Materiales
```

---

### 2. **POST /api/items**
Crear un nuevo item

**Request Body:**
```json
{
  "nombre": "Cemento Portland",
  "descripcion": "Cemento tipo Portland 50kg",
  "precio_sugerido": 1500.00,
  "unidad_medida": "bolsas",
  "categoria": "Materiales",
  "created_by": 1
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "nombre": "Cemento Portland",
  ...
}
```

**Errores:**
- `400 Bad Request`: Datos inválidos (validación Zod)
- `500 Internal Server Error`: Error del servidor

---

### 3. **GET /api/items/[id]**
Obtener un item específico por ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "nombre": "Cemento Portland",
  ...
}
```

**Errores:**
- `400 Bad Request`: ID inválido
- `404 Not Found`: Item no encontrado
- `500 Internal Server Error`: Error del servidor

---

### 4. **PUT /api/items/[id]**
Actualizar un item existente

**Request Body:** (todos los campos son opcionales)
```json
{
  "nombre": "Cemento Portland Modificado",
  "precio_sugerido": 1600.00,
  "is_active": true
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "nombre": "Cemento Portland Modificado",
  ...
}
```

**Errores:**
- `400 Bad Request`: Datos inválidos o ID inválido
- `404 Not Found`: Item no encontrado
- `500 Internal Server Error`: Error del servidor

---

### 5. **DELETE /api/items/[id]**
Soft delete - Marcar item como inactivo

**Response:** `200 OK`
```json
{
  "message": "Item marcado como inactivo correctamente"
}
```

**Errores:**
- `400 Bad Request`: ID inválido
- `404 Not Found`: Item no encontrado
- `409 Conflict`: Item está en uso en órdenes de compra
  ```json
  {
    "error": "No se puede eliminar el item porque está siendo utilizado en órdenes de compra",
    "suggestion": "Puedes marcarlo como inactivo en su lugar"
  }
  ```
- `500 Internal Server Error`: Error del servidor

---

### 6. **POST /api/items/[id]/reactivate**
Reactivar un item inactivo

**Response:** `200 OK`
```json
{
  "message": "Item reactivado correctamente"
}
```

**Errores:**
- `400 Bad Request`: ID inválido
- `404 Not Found`: Item no encontrado
- `500 Internal Server Error`: Error del servidor

---

### 7. **GET /api/items/search**
Buscar items por nombre o descripción

**Query Parameters:**
- `query` (string, requerido): Texto a buscar

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "nombre": "Cemento Portland",
    ...
  }
]
```

**Ejemplo:**
```bash
GET /api/items/search?query=cemento
```

**Errores:**
- `400 Bad Request`: Query vacío o no proporcionado
- `500 Internal Server Error`: Error del servidor

---

### 8. **GET /api/items/categorias**
Obtener todas las categorías únicas de items activos

**Response:** `200 OK`
```json
[
  "Materiales",
  "Servicios",
  "Equipos",
  "Herramientas"
]
```

---

## Validaciones (Zod Schemas)

### CreateItemSchema
```typescript
{
  nombre: string (min: 2, max: 200) - requerido
  descripcion: string - opcional
  precio_sugerido: number (>= 0) - opcional
  unidad_medida: string (max: 50) - opcional
  categoria: string (max: 100) - opcional
  created_by: number - opcional
}
```

### UpdateItemSchema
```typescript
{
  nombre: string (min: 2, max: 200) - opcional
  descripcion: string - opcional
  precio_sugerido: number (>= 0) - opcional
  unidad_medida: string (max: 50) - opcional
  categoria: string (max: 100) - opcional
  is_active: boolean - opcional
}
```

---

## Notas de Implementación

1. **Soft Delete**: Los items nunca se eliminan físicamente, solo se marcan como `is_active = false`
2. **Protección**: Si un item está en uso en OCs, no se puede desactivar (retorna 409 Conflict)
3. **Búsqueda**: Usa ILIKE en PostgreSQL para búsquedas case-insensitive
4. **Límite de resultados**: La búsqueda retorna máximo 20 items
5. **Ordenamiento**: Los items se ordenan alfabéticamente por nombre
