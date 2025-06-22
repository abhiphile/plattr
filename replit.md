# Plattr - Restaurant Management Platform

## Overview

A full-stack web application that provides an AI-powered merchant dashboard for managing multi-platform restaurant operations. The system helps merchants connect to delivery platforms (Swiggy, Zomato, MagicPin), manage offers, run promotional campaigns, and analyze performance through an intelligent assistant interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom merchant-themed color variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Chart.js with React integration for analytics visualization

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **AI Integration**: OpenAI GPT-4o for intelligent assistant capabilities
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

### Development Environment
- **Deployment**: Replit with autoscale deployment target
- **Development Server**: Vite dev server with HMR
- **Package Manager**: npm with lockfile version 3
- **TypeScript**: Strict mode enabled with modern ES modules

## Key Components

### Database Schema
The application uses a PostgreSQL database with three main entities:

1. **Merchants**: Store merchant profile information including name, contact details, store timings, and delivery settings
2. **Platforms**: Track connections to delivery platforms with authentication credentials and sync status
3. **Offers**: Manage promotional offers with discount types, platform targeting, and scheduling

### AI Assistant System
- **Context-Aware Chat**: Provides specialized assistance for offers, promotions, settings, and analytics
- **OpenAI Integration**: Uses GPT-4o model for intelligent responses
- **Conversation Persistence**: Maintains chat history and context across sessions
- **Action Suggestions**: Recommends specific actions based on merchant queries

### Platform Integration Service
- **Multi-Platform Support**: Handles authentication and data sync for Swiggy, Zomato, and MagicPin
- **Credential Management**: Securely stores encrypted platform credentials
- **Status Tracking**: Monitors connection health and last sync timestamps
- **Mock Implementation**: Currently simulates platform APIs for development

### Analytics and Reporting
- **Performance Metrics**: Revenue, order tracking, and growth calculations
- **Chart Visualizations**: Line charts for trends, platform comparison views
- **Export Capabilities**: PDF report generation for business insights
- **Real-time Updates**: Live data refresh with TanStack Query

## Data Flow

1. **User Authentication**: Merchant profile loaded from database on app start
2. **Platform Connections**: Credentials stored securely, connection status monitored
3. **Offer Management**: CRUD operations with real-time validation and AI assistance
4. **Analytics Pipeline**: Data aggregation from multiple platforms for unified reporting
5. **AI Interactions**: Context-aware chat with conversation history persistence

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **openai**: Official OpenAI API client for GPT-4o integration

### UI Components
- **@radix-ui/***: Comprehensive set of unstyled UI primitives
- **class-variance-authority**: Type-safe CSS class composition
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Modern icon library

### Development Tools
- **tsx**: TypeScript execution for development server
- **esbuild**: Fast JavaScript bundler for production builds
- **vite**: Fast build tool with HMR support

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev` - Starts development server with hot reload
- **Port**: 8080 (mapped to external port 80)
- **Database**: Uses DATABASE_URL environment variable for Neon connection

### Production Build
- **Build Process**: 
  1. Vite builds client-side React application
  2. esbuild bundles server-side Express application
  3. Static files served from dist/public directory
- **Start Command**: `npm run start` - Runs production server from dist/index.js
- **Environment**: NODE_ENV=production with optimized builds

### Database Management
- **Schema Migrations**: Managed through Drizzle Kit with `npm run db:push`
- **Connection**: Serverless PostgreSQL through Neon Database
- **Environment Variables**: DATABASE_URL required for database connectivity

## Recent Changes

### Enhanced Responsive Dashboard with Alert Monitoring (June 21, 2025)
- **Responsive Design**: Implemented mobile-first responsive layout with breakpoints
- **Quick Actions**: Added restaurant status controls (online/offline toggles for each platform)
- **Alert Monitor**: Real-time monitoring system with critical/warning/info alerts
- **Notification System**: Email and Telegram notification capabilities with test functions
- **Emergency Controls**: Quick access to emergency shutdown, pause orders, holiday mode
- **Mobile Optimizations**: Floating action button, collapsible navigation, optimized card layouts

### Key Features Added:
- QuickActions component with platform-specific controls
- AlertMonitor component with configurable thresholds  
- Real-time alert checking every 30 seconds
- Notification settings with email/Telegram integration
- Emergency and bulk action capabilities across all platforms
- Mobile-responsive grid layouts and typography scaling

## Changelog
```
Changelog:
- June 21, 2025. Initial setup
- June 21, 2025. Enhanced responsive design and alert monitoring
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```