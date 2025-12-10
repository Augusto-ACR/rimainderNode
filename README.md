# 🗓️ Rimainder

**WebSite de recordatorios de eventos integrada con Telegram**

Una aplicación web moderna que permite crear, gestionar y recordar eventos importantes directamente desde un calendario interactivo, con notificaciones automáticas por Telegram.

---

## ✨ Características Principales

- 📅 **Calendario Interactivo**: Visualiza y gestiona tus eventos en un calendario responsive
- 🔔 **Recordatorios Automáticos**: Recibe notificaciones por Telegram:
  - 1 día antes del evento
  - 1 hora antes del evento
  - 30 minutos antes del evento
- 🤖 **Integración con Telegram Bot**: 
  - Crea eventos directamente desde Telegram usando comandos
  - Inicia sesión automáticamente con tu cuenta de Telegram
  - Acceso a mini app para crear eventos desde el chat
- 🏷️ **Categorías de Eventos**: Cumpleaños, Exámenes, Deportes, Trabajo, Médico, Viaje y Otros
- 🔐 **Autenticación Segura**: JWT + Passport
- 📱 **Diseño Responsive**: Funciona perfectamente en móviles, tablets y desktop
- 💾 **Base de Datos PostgreSQL**: Almacenamiento seguro y confiable

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js** v18 o superior
- **PostgreSQL** v12 o superior
- **npm** o **yarn**
- Un **Bot de Telegram** (obtén el token en BotFather)

### Pasos de Instalación

#### 1. Clona el repositorio

```bash
git clone https://github.com/Augusto-ACR/rimainderNode.git
cd rimainderNode
```

#### 2. Instala las dependencias

```bash
npm install
```

#### 3. Configura las variables de entorno

Crea un archivo `.env` en la raíz del proyecto con los siguientes valores:

```env
# Base de Datos
DB_HOST=tu_host_postgres
DB_USER=tu_usuario_postgres
DB_PASS=tu_contraseña_postgres
DATABASE=nombre_base_datos
DB_PORT=5432

# Servidor
PORT=3000
NODE_ENV=development

# Telegram
TELEGRAM_BOT_TOKEN=tu_token_del_bot
TELEGRAM_CHAT_ID=tu_chat_id_telegram

# JWT
JWT_SECRET=tu_clave_secreta_jwt

# API
API_BASE_URL=http://localhost:3000
```

#### 4. Inicializa la base de datos

TypeORM sincronizará automáticamente las entidades cuando inicies el servidor (modo desarrollo).

#### 5. Inicia el servidor

```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

---

## 📖 Cómo Usar

### Desde el Sitio Web

1. **Regístrate o Inicia Sesión**
   - Accede a https://rimaindernode.onrender.com/
   - Completa el formulario de registro con:
     - Usuario
     - Contraseña
     - Chat ID de Telegram (obtén en BotFather: /start en @userinfobot)

2. **Crea un Evento**
   - Navega al calendario
   - Selecciona un día
   - Completa el formulario del evento con:
     - Título
     - Hora
     - Categoría
     - Descripción (opcional)

3. **Recibe Recordatorios**
   - El sistema enviará notificaciones automáticas por Telegram
   - 1 día, 1 hora y 30 minutos antes de cada evento

### Desde Telegram

#### Comando `/start`
- Registra tu cuenta automáticamente
- Recibirás tu ID de usuario y contraseña (para acceder desde la web)

```
/start
```

#### Comando `/evento`
Crea un evento directamente desde Telegram (formato CSV):

```
/evento Cumpleaños de Ana, 2025-12-25, 19:30, cumpleaños, Fiesta en casa
```

Formato:
```
/evento Título, YYYY-MM-DD, HH:MM, categoría (opcional), descripción (opcional)
```

Categorías válidas: `cumpleaños`, `examen`, `deportes`, `trabajo`, `medico`, `viaje`, `otro`

#### Comando `/crear`
Abre la mini app de Telegram para crear eventos de forma visual:

```
/crear
```

---

## 🏗️ Estructura del Proyecto

```
rimainderNode/
├── public/                          # Frontend
│   ├── index.html                   # Página de login/registro
│   ├── Calendario.html              # Página principal del calendario
│   ├── Calendario.js                # Lógica del calendario
│   ├── Calendario.api.auth.safe.js  # API client autenticado
│   ├── Usuarios.js                  # Gestión de usuarios
│   ├── form-evento.html             # Formulario de eventos (WebApp Telegram)
│   ├── Calendario.css               # Estilos del calendario
│   └── RegisCss.css                 # Estilos login/registro
│
├── src/                             # Backend
│   ├── index.js                     # Punto de entrada
│   ├── app.js                       # Configuración de Express
│   │
│   ├── configuration/
│   │   ├── envs.js                  # Validación de variables de entorno
│   │   └── passport.js              # Estrategia JWT para autenticación
│   │
│   ├── module/user/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js   # Lógica de registro/login
│   │   │   ├── user.controller.js   # Gestión de usuarios
│   │   │   └── event.controller.user.js  # Gestión de eventos
│   │   │
│   │   ├── entities/
│   │   │   ├── user.entity.js       # Modelo de usuario (TypeORM)
│   │   │   └── event.entity.js      # Modelo de evento (TypeORM)
│   │   │
│   │   ├── midleware/
│   │   │   └── auth.middleware.js   # Middleware de autenticación JWT
│   │   │
│   │   ├── providers/
│   │   │   └── datasource.provider.js  # Configuración de TypeORM/PostgreSQL
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.route.js        # Rutas de autenticación
│   │   │   ├── user.route.js        # Rutas de usuarios
│   │   │   └── event.route.js       # Rutas de eventos
│   │   │
│   │   └── schema/
│   │       ├── user.schema.js       # Validación Joi para usuarios
│   │       └── event.schema.js      # Validación Joi para eventos
│   │
│   ├── utils/
│   │   ├── telegram.js              # Funciones para enviar mensajes (API Telegram)
│   │   └── telegramBot.js           # Webhook del bot (handler de comandos)
│   │
│   └── workers/
│       └── worker.js                # Worker para enviar recordatorios automáticos
│
├── .env                             # Variables de entorno (no commitear)
├── .env.example                     # Ejemplo de variables de entorno
├── package.json                     # Dependencias del proyecto
└── README.md                        # Este archivo
```

---

## 🔧 Stack Tecnológico

### Backend
- **Express.js** (^5.1.0) - Framework web
- **TypeORM** (^0.3.25) - ORM para PostgreSQL
- **PostgreSQL** - Base de datos relacional
- **JWT** (^9.0.2) - Autenticación tokens
- **Passport** (^0.7.0) - Middleware de autenticación
- **Bcrypt** (^6.0.0) - Hash de contraseñas
- **Joi** (^17.13.3) - Validación de esquemas
- **node-cron** (^4.2.1) - Tareas programadas (recordatorios)
- **CORS** (^2.8.5) - Control de acceso cross-origin
- **Signale** (^1.4.0) - Logging mejorado
- **Nodemon** (^3.1.10) - Reload en desarrollo

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos responsive
- **Vanilla JavaScript** - Lógica interactiva
- **Telegram Web App API** - Integración con Telegram

---

## 📡 API Endpoints

### Autenticación

```http
POST /auth/register
POST /auth/login
POST /auth/register-telegram
GET /auth/me
```

### Usuarios

```http
GET /users
GET /users/:id
PUT /users/:id
DELETE /users/:id
```

### Eventos

```http
GET /events
POST /events
GET /events/:id
PUT /events/:id
DELETE /events/:id
```

### Telegram Bot Webhook

```http
POST /bot<TELEGRAM_BOT_TOKEN>
```

---

## 🤖 Configuración del Bot de Telegram

### 1. Crear el Bot

1. Abre Telegram y busca **@BotFather**
2. Envía el comando `/newbot`
3. Elige un nombre para tu bot (ej: Rimainder)
4. Elige un username (ej: @RimainderBot-bot)
5. **Guarda el token** que te genera

### 2. Configurar Webhook

Una vez que tu aplicación esté hosteada, registra el webhook:

```bash
curl "https://api.telegram.org/bot<TU_TOKEN>/setWebhook?url=https://rimaindernode.onrender.com/bot<TU_TOKEN>"
```

Verifica que se configuró correctamente:

```bash
curl "https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo"
```

Deberías recibir algo como:
```json
{
  "ok": true,
  "result": {
    "url": "https://rimaindernode.onrender.com/bot<TU_TOKEN>",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### 3. Agregar Mini App (Formulario de Eventos)

1. En BotFather, envía `/mybots`
2. Selecciona tu bot
3. Selecciona "Bot Settings"
4. Selecciona "Menu Button"
5. Selecciona "Configure menu button for Web App"
6. Ingresa:
   - Label: `📝 Crear evento`
   - URL: `https://rimaindernode.onrender.com/form-evento.html`

---

## ⏰ Sistema de Recordatorios

El worker (`src/workers/worker.js`) se ejecuta cada minuto y:

1. **Lee todos los eventos** de la base de datos
2. **Calcula el tiempo restante** hasta cada evento
3. **Envía recordatorios por Telegram** cuando falte:
   - 1 día (24 horas)
   - 1 hora
   - 30 minutos
4. **Marca como enviado** para no duplicar notificaciones

### Formato de Recordatorio

```
🔔 RECORDATORIO

🗓️ [Título del evento]
📅 Fecha: YYYY-MM-DD
⏰ Hora: HH:MM
📂 Categoría: [categoría]

⏱️ Se acerca tu evento!
```

---

## 🐛 Troubleshooting

### Error: "No se pudo iniciar sesión automáticamente"

**Causa**: El endpoint `/auth/register-telegram` no responde correctamente.

**Solución**:
1. Verifica que el backend está corriendo: `npm start`
2. Confirma que `API_BASE_URL` en el frontend es correcto
3. Revisa los logs del servidor para errores

### Los recordatorios no llegan

**Causa**: El worker no está corriendo o el `chat_id` es incorrecto.

**Solución**:
1. Verifica que el usuario tenga un `chat_id` en la base de datos
2. Confirma que `TELEGRAM_BOT_TOKEN` es válido en `.env`
3. Revisa los logs del servidor: `npm start`

### El bot no responde a comandos

**Causa**: El webhook no está configurado correctamente.

**Solución**:
1. Ejecuta: `curl "https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo"`
2. Confirma que `url` es correcta y accesible
3. Vuelve a registrar el webhook con `setWebhook`

### Error de Base de Datos

**Causa**: PostgreSQL no está disponible o variables de entorno incorrectas.

**Solución**:
1. Verifica que PostgreSQL está corriendo
2. Confirma credenciales en `.env`
3. Prueba conectar manualmente: `psql -h <host> -U <user> -d <database>`

---

## 📝 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASS` | Contraseña de PostgreSQL | `mi_password` |
| `DATABASE` | Nombre de la base de datos | `rimainder_db` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Ambiente | `development` |
| `TELEGRAM_BOT_TOKEN` | Token del bot (de BotFather) | `123456:ABC-xyz` |
| `TELEGRAM_CHAT_ID` | Chat ID para notificaciones | `6023136805` |
| `JWT_SECRET` | Clave secreta para JWT | `mi_clave_super_secreta` |
| `API_BASE_URL` | URL base de la API | `http://localhost:3000` |

---

## 🚀 Deploy

### Deploy en Render.com

1. Sube tu repositorio a GitHub
2. Conecta tu repositorio en [Render.com](https://render.com)
3. Configura las variables de entorno en el dashboard
4. Deploy automático en cada push

### Variables de Entorno en Producción

Asegúrate de configurar:
- `API_BASE_URL` con tu URL de Render (ej: `https://rimaindernode.onrender.com`)
- PostgreSQL en Render o un servicio externo
- `TELEGRAM_BOT_TOKEN` válido

---

## 📄 Licencia

Este proyecto está bajo la licencia **ISC**.

---

## 👨‍💻 Autor

**Augusto Rodríguez** ([@Augusto-ACR](https://github.com/Augusto-ACR))

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Soporte

¿Problemas o preguntas? Abre un [issue](https://github.com/Augusto-ACR/rimainderNode/issues) en GitHub.

---

## 🎯 Roadmap Futuro

- [ ] Edición de eventos en tiempo real
- [ ] Múltiples calendarios compartidos
- [ ] Notificaciones por email
- [ ] Integración con Google Calendar
- [ ] Exportar eventos (iCal)
- [ ] Tema oscuro
- [ ] Soporte para múltiples idiomas

---

**¡Gracias por usar Rimainder! 🎉**
