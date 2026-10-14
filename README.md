# DevOps Items API

Micro-API REST con **Node.js 22, TypeScript, Express y PostgreSQL 16**, preparada para ejecutarse con Docker Compose y validarse mediante GitHub Actions.

## Funcionalidades

- `GET /health`: comprueba la conectividad real con PostgreSQL. Devuelve `200` con `{ "status": "ok", "database": "connected" }` o `503` si la base de datos no responde.
- `POST /items`: valida `name` y `description`, recorta espacios en los extremos y guarda el elemento. Responde `201` al crear o `400` si el payload es inválido.
- `GET /items`: devuelve todos los elementos almacenados, ordenados por ID ascendente.
- Variables de entorno para puertos y credenciales; no se versiona el archivo `.env`.
- Dockerfile multi-stage, usuario sin privilegios, red Bridge dedicada, volumen persistente y arranque condicionado al healthcheck de PostgreSQL.
- Pruebas automatizadas de API y pipeline de CI para revisar tipos, ejecutar pruebas y compilar la imagen Docker.

## Requisitos previos

- Git
- Docker Desktop actualizado (Windows/macOS) o Docker Engine con el complemento `docker compose` (Linux)
- Node.js 22 o superior y npm 10 o superior (solo para ejecutar las pruebas fuera de Docker)

## Ejecutar con Docker Compose

Desde la carpeta raíz del repositorio:

1. Crea el archivo local de variables a partir de la plantilla.

   ```bash
   cp .env.example .env
   ```

   En Windows PowerShell puedes usar `Copy-Item .env.example .env`.

2. Edita `.env` y cambia `DB_PASSWORD` por una contraseña local segura. Mantén `DB_HOST=db` para Compose. `API_PORT` define el puerto publicado de la API; `DB_PORT` es el puerto de PostgreSQL dentro de la red del proyecto.

3. Levanta el stack con el comando solicitado en la prueba:

   ```bash
   docker compose up --build -d
   ```

4. Revisa el estado y los logs:

   ```bash
   docker compose ps
   docker compose logs -f api db
   ```

5. Prueba el estado de salud en `http://localhost:3000/health` (o el puerto que hayas definido en `API_PORT`).

La primera ejecución crea la tabla desde `database/init.sql`. El volumen `postgres_data` conserva los datos al reiniciar o recrear los contenedores. `docker compose down` no elimina ese volumen; `make clean` sí lo elimina y, por tanto, borra los datos persistidos.

## Probar los endpoints

### Salud y conectividad a la base de datos

```bash
curl -i http://localhost:3000/health
```

Respuesta esperada cuando PostgreSQL está disponible:

```json
{
  "status": "ok",
  "database": "connected"
}
```

### Crear un elemento

```bash
curl -i -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Teclado","description":"Teclado mecánico USB"}'
```

Respuesta esperada: `201 Created`, con los datos guardados, su `id` y `created_at`.

### Listar elementos

```bash
curl -i http://localhost:3000/items
```

### Probar validación

```bash
curl -i -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"   ","description":""}'
```

Respuesta esperada: `400 Bad Request` con el objeto `details` que indica los campos inválidos. `name` admite hasta 120 caracteres y `description` hasta 2,000 caracteres.

## Ejecutar pruebas sin Docker

Las pruebas usan una base de datos simulada, por lo que no requieren PostgreSQL:

```bash
npm install
npm run lint
npm test
```

Para ejecutar el servidor de forma local contra una instancia PostgreSQL, crea `.env` y ajusta `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `PORT`. La tabla debe existir; puedes aplicar `database/init.sql`. Inicia en modo desarrollo con `npm run dev`.

## CI: GitHub Actions

El workflow `.github/workflows/ci.yml` se ejecuta en cada `push` y `pull_request` dirigidos a `main`. Realiza checkout, instala Node.js 22, ejecuta la comprobación de TypeScript, corre las pruebas y construye la imagen Docker en un runner limpio.

## Decisiones técnicas y mejoras futuras

Express y TypeScript permiten mantener una API pequeña y tipada sin una estructura de framework demasiado pesada. PostgreSQL almacena los elementos; el pool limita conexiones y el endpoint de salud ejecuta una consulta real. Docker usa etapas separadas para dependencias, compilación y runtime; la imagen final ejecuta como el usuario `node` e incluye solo el código compilado y dependencias de producción. Compose no publica el puerto de PostgreSQL y espera a que `pg_isready` lo marque saludable antes de iniciar la API.

Con más tiempo agregaría migraciones versionadas (por ejemplo, con node-pg-migrate), pruebas de integración contra un PostgreSQL temporal, métricas y logs estructurados, escaneo de vulnerabilidades de dependencias e imagen, secretos gestionados por el entorno de despliegue y despliegue continuo a un entorno de staging.

## Comandos de ayuda

```bash
make up      # Construye y levanta los servicios
make down    # Detiene y elimina contenedores, conserva el volumen de datos
make logs    # Sigue los logs de API y base de datos
make test    # Ejecuta pruebas automatizadas
make lint    # Verifica tipos TypeScript
make clean   # Elimina contenedores y volumen persistente (BORRA los datos)
```
