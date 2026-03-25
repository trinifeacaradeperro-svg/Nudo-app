# NUDO - Red Social

## Overview

NUDO es una red social de mensajería privada tipo WhatsApp, 100% gratuita para los usuarios. Se monetiza con un anuncio que se muestra al iniciar la app. Totalmente en español, sin vigilancia de gobiernos ni terceros.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Mobile**: Expo (React Native) con Expo Router
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── mobile/             # Expo React Native app (NUDO)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
```

## Features

### Mobile App (NUDO)
- Registro e inicio de sesión (usuario + contraseña, sin teléfono)
- Anuncio (AdModal) al entrar a la app — fuente de monetización
- Lista de conversaciones con contador de mensajes no leídos
- Chat en tiempo real (polling cada 3 segundos)
- Búsqueda de usuarios por nombre de usuario
- Perfil de usuario con color personalizado
- Mensajes con indicadores de lectura (✓ / ✓✓)
- Diseño oscuro moderno, 100% en español
- Declaración de privacidad visible: sin vigilancia de gobiernos ni terceros
- Liquid Glass tab bar en iOS 26+

### Backend API (Express)
- POST /api/auth/register — Registro de usuarios
- POST /api/auth/login — Inicio de sesión
- GET /api/users/me — Perfil propio
- GET /api/users/search?q= — Búsqueda de usuarios
- GET /api/conversations — Lista de conversaciones
- POST /api/conversations — Crear/obtener conversación
- GET /api/conversations/:id/messages — Mensajes de una conv
- POST /api/conversations/:id/messages — Enviar mensaje

## Database Schema
- users: id, username, displayName, passwordHash, avatarColor, createdAt
- conversations: id, user1Id, user2Id, createdAt, updatedAt
- messages: id, conversationId, senderId, content, readAt, createdAt

## Monetización
- Un anuncio de 5 segundos se muestra al entrar a la app
- El anuncio es genérico y NO usa datos del usuario para personalizarlo
- Los usuarios no pueden saltarlo durante los primeros 5 segundos
