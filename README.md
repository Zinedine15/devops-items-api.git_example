# DevOps Items API

Micro-API REST desarrollada con **Node.js 22, TypeScript, Express y PostgreSQL 16**, preparada para ejecutarse mediante Docker Compose y validarse automáticamente con GitHub Actions.

El proyecto permite crear y consultar elementos, verificar la conectividad con la base de datos y ejecutar pruebas automatizadas para validar su funcionamiento.

## Funcionalidades

- `GET /health`: comprueba la conectividad real con PostgreSQL. Devuelve `200 OK` cuando la base de datos está disponible y `503 Service Unavailable` cuando no responde.
- `POST /items`: valida los campos `name` y `description`, elimina espacios al inicio y al final y guarda el elemento en PostgreSQL. Devuelve `201 Created` cuando se crea correctamente o `400 Bad Request` cuando los datos son inválidos.
- `GET /items`: devuelve los elementos almacenados, ordenados por ID ascendente.
- **Variables de entorno:** permite configurar los puertos y las credenciales sin incluir información sensible en el repositorio.
- **Docker:** utiliza una imagen multi-stage, ejecución como usuario sin privilegios, red Bridge dedicada y volumen persistente para PostgreSQL.
- **Docker Compose:** espera a que PostgreSQL supere su comprobación de salud antes de iniciar la API.
- **Pruebas automatizadas:** incluye pruebas para validar el comportamiento de los endpoints.
- **Integración continua:** GitHub Actions verifica los tipos de TypeScript, ejecuta las pruebas y construye la imagen Docker.

## Tecnologías utilizadas

- Node.js 22
- TypeScript
- Express
- PostgreSQL 16
- Docker y Docker Compose
- Git y GitHub
- GitHub Actions

## Requisitos previos

Antes de ejecutar el proyecto, asegúrate de contar con:

- Git para clonar el repositorio.
- Docker Desktop actualizado en Windows o macOS, o Docker Engine con el complemento `docker compose` en Linux.
- Una terminal compatible con los comandos de Docker.
- Node.js 22 o superior y npm 10 o superior únicamente si deseas ejecutar las pruebas o iniciar la aplicación fuera de Docker.

No es necesario instalar PostgreSQL directamente en el equipo cuando se utiliza Docker Compose.

## Instalación y ejecución

### 1. Clonar el repositorio

Clona el repositorio y accede a la carpeta del proyecto:

```bash
git clone https://github.com/USUARIO/devops-items-api.git_example/
cd devops-items-api
```

Sustituye `USUARIO` por el nombre de usuario o la organización propietaria del repositorio.
En este caso es: `Zinedine15`.

### 2. Configurar las variables de entorno

Crea el archivo `.env` a partir de la plantilla `.env.example`.

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

En Linux o macOS:

```bash
cp .env.example .env
```

Abre el archivo `.env` y revisa las variables de configuración. Cambia `DB_PASSWORD` por una contraseña local segura y asegúrate de que las variables coincidan con la configuración del proyecto.

- `API_PORT`: puerto del equipo en el que se publica la API.
- `DB_HOST`: nombre del servicio de PostgreSQL dentro de la red de Docker Compose; normalmente `db`.
- `DB_PORT`: puerto interno de PostgreSQL.
- `DB_NAME`: nombre de la base de datos.
- `DB_USER`: usuario de PostgreSQL.
- `DB_PASSWORD`: contraseña de PostgreSQL.
- `PORT`: puerto en el que escucha la aplicación dentro de su contenedor, si así lo define su configuración.

**Importante:** el nombre de cada variable debe coincidir exactamente con el utilizado por la aplicación y por `compose.yaml`. No se debe de publicar tu archivo `.env` ni incluir credenciales reales en Git.

### 3. Construir y levantar los servicios

Desde la raíz del repositorio, ejecuta:

```bash
docker compose up --build -d
```

Este comando construye la imagen de la API, descarga las imágenes necesarias e inicia los contenedores en segundo plano.

### 4. Verificar el estado de los contenedores

```bash
docker compose ps
```

Para consultar los registros de la API y de PostgreSQL:

```bash
docker compose logs -f api db
```

Para salir de la visualización de logs, presiona `Ctrl + C`. Esto no detiene los contenedores.

### 5. Comprobar la disponibilidad de la API

Abre la siguiente dirección en el navegador o realiza una petición HTTP:

```text
http://localhost:3000/health
```

Si modificaste `API_PORT`, utiliza el puerto que hayas configurado.

## Probar los endpoints

Los siguientes ejemplos utilizan el puerto `3000`. Si configuraste otro puerto, reemplaza el valor en las URL.

### 1. Comprobar la salud de la API y de PostgreSQL

#### Usando cURL

```bash
curl -i http://localhost:3000/health
```

#### Usando Windows PowerShell

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

Respuesta esperada cuando PostgreSQL está disponible:

```json
{
  "status": "ok",
  "database": "connected"
}
```

El código HTTP esperado es `200 OK`. Si PostgreSQL no está disponible, la API debe responder con `503 Service Unavailable`.

### 2. Crear un elemento

El endpoint `POST /items` permite insertar un registro enviando un objeto JSON con los campos `name` y `description`.

#### Opción A. Usando cURL

```bash
curl -i -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Teclado","description":"Teclado mecanico USB"}'
```

La respuesta esperada es `201 Created`, con los datos del elemento creado, su identificador (`id`) y su fecha de creación (`created_at`).

#### Opción B. Usando Windows PowerShell

En Windows PowerShell, puedes utilizar `ConvertTo-Json` para generar el cuerpo JSON e `Invoke-RestMethod` para enviar la petición HTTP.

**Paso 1. Preparar los datos del elemento.**

```powershell
$body = @{
    name = "Teclado"
    description = "Teclado mecanico USB"
} | ConvertTo-Json -Compress
```

En este ejemplo, el elemento se llama `Teclado` y su descripción es `Teclado mecanico USB`. Puedes modificar ambos valores según tus necesidades.

**Paso 2. Enviar la petición para crear el registro.**

```powershell
Invoke-RestMethod `
    -Uri "http://localhost:3000/items" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

El carácter de acento grave (`` ` ``) al final de cada línea permite continuar el comando en la siguiente línea de PowerShell.

**Paso 3. Comprobar la respuesta.**

Si la operación se realiza correctamente, la API devuelve los datos del elemento creado. Por ejemplo, la respuesta tendrá una estructura similar a esta:

```json
{
  "id": 1,
  "name": "Teclado",
  "description": "Teclado mecanico USB",
  "created_at": "2026-10-14T12:00:00.000Z"
}
```

Los valores de `id` y `created_at` son ilustrativos: los valores reales dependerán de la base de datos y del momento de ejecución.

### 3. Consultar los elementos registrados

#### Usando cURL

```bash
curl -i http://localhost:3000/items
```

#### Usando Windows PowerShell

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/items"
```

La API devuelve la lista de elementos almacenados en PostgreSQL, ordenados por ID ascendente.

Puedes utilizar esta consulta para verificar que el registro enviado mediante `POST /items` quedó guardado correctamente.

**Nota:** cada petición `POST` válida crea un nuevo registro. Para comprobar una inserción, consulta `GET /items` en lugar de repetir la petición `POST`.

### 4. Probar la validación de datos

El siguiente ejemplo envía datos inválidos porque ambos campos están vacíos o contienen únicamente espacios.

#### Usando cURL

```bash
curl -i -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"   ","description":""}'
```

#### Usando Windows PowerShell

```powershell
$body = @{
    name = "   "
    description = ""
} | ConvertTo-Json -Compress

Invoke-RestMethod `
    -Uri "http://localhost:3000/items" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

La respuesta esperada es `400 Bad Request`, con información sobre los campos que no superaron la validación.

Los límites definidos para los campos son:

- `name`: hasta 120 caracteres.
- `description`: hasta 2,000 caracteres.

### 5. Solución de problemas

Si no puedes insertar un elemento o recibes un error al consultar los endpoints, sigue estos pasos.

**Comprobar que los contenedores estén activos:**

```powershell
docker compose ps
```

**Verificar la conectividad con PostgreSQL:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**Consultar los logs de la API y de PostgreSQL:**

```powershell
docker compose logs --tail=100 api db
```

**Reiniciar los servicios si es necesario:**

```powershell
docker compose up --build -d
```

Si cambiaste las variables de entorno, revisa que sean correctas y vuelve a crear los contenedores cuando corresponda.

Si el problema continúa, verifica que el puerto configurado no esté ocupado por otro proceso y que estés ejecutando los comandos desde la carpeta raíz del proyecto.

## Ejecutar las pruebas sin Docker

Las pruebas automatizadas utilizan una base de datos simulada, por lo que no requieren una instancia real de PostgreSQL.

Instala las dependencias:

```bash
npm install
```

Ejecuta la comprobación de tipos de TypeScript:

```bash
npm run lint
```

Ejecuta las pruebas automatizadas:

```bash
npm test
```

Para ejecutar el servidor fuera de Docker contra una instancia real de PostgreSQL, configura el archivo `.env` con los parámetros de conexión correspondientes y asegúrate de que la tabla exista. Puedes utilizar `database/init.sql` para inicializar el esquema.

Después, inicia el servidor en modo desarrollo:

```bash
npm run dev
```

## Integración continua (CI): GitHub Actions

El workflow se encuentra en:

```text
.github/workflows/ci.yml
```

Se ejecuta en cada `push` y `pull_request` dirigidos a la rama `main`.

El pipeline realiza las siguientes tareas:

1. Descarga el código del repositorio.
2. Configura Node.js 22.
3. Instala las dependencias.
4. Comprueba los tipos de TypeScript.
5. Ejecuta las pruebas automatizadas.
6. Construye la imagen Docker para verificar que el proyecto pueda empaquetarse correctamente.

Para consultar el resultado, abre el repositorio en GitHub y entra en la pestaña **Actions**. Una ejecución exitosa debe mostrar todos los pasos completados sin errores.

## Decisiones técnicas y mejoras futuras

Se eligieron Express y TypeScript para construir una API ligera, tipada y sencilla de mantener, sin introducir una estructura de framework innecesariamente compleja. PostgreSQL proporciona persistencia relacional y el pool de conexiones permite administrar las consultas a la base de datos. El endpoint de salud ejecuta una consulta real para comprobar la conectividad.

Docker utiliza una construcción multi-stage para separar la compilación del entorno de ejecución. La imagen final ejecuta la aplicación con un usuario sin privilegios e incluye únicamente el código compilado y las dependencias de producción. Docker Compose configura una red dedicada, un volumen persistente y una dependencia condicionada al estado saludable de PostgreSQL. El puerto de PostgreSQL no necesita publicarse al equipo anfitrión para que la API se conecte dentro de la red de Compose.

Con más tiempo, incorporaría migraciones de base de datos versionadas, pruebas de integración contra una instancia temporal de PostgreSQL, logs estructurados, métricas, análisis de vulnerabilidades de dependencias e imágenes, gestión de secretos en el entorno de despliegue y despliegue continuo a un entorno de staging.

## Comandos de ayuda

Si el repositorio incluye el `Makefile`, también puedes utilizar los siguientes comandos:

```bash
make up      # Construye y levanta los servicios
make down    # Detiene y elimina los contenedores, conserva el volumen
make logs    # Muestra los logs de la API y la base de datos
make test    # Ejecuta las pruebas automatizadas
make lint    # Comprueba los tipos de TypeScript
make clean   # Elimina los contenedores y el volumen persistente
```

**Advertencia:** `make clean` elimina el volumen persistente y, por tanto, los datos almacenados en PostgreSQL. Utilízalo únicamente cuando realmente quieras borrar esos datos.