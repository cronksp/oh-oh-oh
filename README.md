# Whereabouts

**Team availability and whereabouts tracker** - Know where your team is, when they're unavailable, and what they're working on.

## Overview

Whereabouts is an internal team calendar application designed to track team member availability, out-of-office events, and general whereabouts. It provides a simple, clean interface for teams to coordinate schedules and know when colleagues are available.

## Features

- 📅 **Multiple Calendar Views**: Month, Week, Day, and List views
- 🔐 **Privacy Controls**: Public events for team visibility, private events for personal matters
- 👥 **Group Management**: Organize events by teams, projects, or departments
- ⚙️ **Admin Tools**: User management, password reset, group admin assignment
- 🎨 **Modern UI**: Clean design with dark mode support
- 🔒 **Encrypted Private Events**: Personal events are encrypted end-to-end

## Event Types

- **Vacation** - Out on vacation
- **Sick Leave** - Out sick
- **Project Travel** - Business travel
- **Personal Travel** - Personal travel
- **Personal Appointment** - Doctor, dentist, etc.
- **Work Meeting** - In a meeting
- **Work Gathering** - Team events, conferences

## Quick Start

### Development

1. **Start the services:**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Push database schema:**
   ```bash
   npm run db:push
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

### First User

Register the first user at `/register` - they will automatically be assigned the `admin` role.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT sessions with encrypted cookies
- **Styling**: Tailwind CSS + shadcn/ui
- **Encryption**: Native crypto for private events

## Deployment

See `deployment/deploy.sh` for production deployment instructions.

## License

Internal use only.
