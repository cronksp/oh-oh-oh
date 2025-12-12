# Architecture

## Overview
"Whereabouts" is a Next.js application built with the App Router, designed for internal company use. It provides shared availability calendars and private event tracking with encryption.

## Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Metallic Theme)
- **Database**: PostgreSQL (Default) / MSSQL (Supported via Drizzle)
- **ORM**: Drizzle ORM
- **Auth**: Custom Email/Password + Session Cookies (Encrypted)
- **Encryption**: AES-256-GCM for private event data

## Directory Structure
- `src/app`: Next.js routes.
  - `(public)`: Public routes (Login, Register).
  - `(auth)`: Authenticated routes (Calendar, Settings).
  - `(admin)`: Admin routes.
  - `api`: API route handlers.
- `src/components`: React components.
  - `ui`: shadcn/ui primitives.
  - `calendar`: Calendar-specific components.
- `src/features`: Feature-based logic (Server Actions).
- `src/lib`: Shared utilities (DB, Auth, Crypto, Logging).

## Key Components
- **Auth**: `src/lib/auth` handles password hashing and session management.
- **Database**: `src/lib/db` contains the Drizzle client and schema.
- **Encryption**: `src/lib/crypto` handles AES-256-GCM encryption for private data.
