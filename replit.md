# Overview

This project is a comprehensive fire safety management portal (МЧС Portal) for the Ministry of Emergency Situations of Kazakhstan. Its primary purpose is to streamline fire incident reporting, statistical form generation, and compliance reporting through a web-based interface. The system features full-stack TypeScript architecture, enabling efficient management of fire incident logging, automated generation of official statistical reports (forms 1-ОСП through 6-ССПЗ), data visualization via charts, and hierarchical organization management with robust role-based access control.

The business vision is to provide a reliable, scalable, and user-friendly platform that enhances the efficiency and accuracy of fire safety data management across Kazakhstan, supporting informed decision-making and improving national emergency response capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with custom dark theme, shadcn/ui component library
- **Routing**: Wouter
- **State Management**: TanStack Query for server state
- **Form Management**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Node.js with Express.js
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM for PostgreSQL
- **Authentication**: Replit Authentication
- **Access Control**: Role-based access control with hierarchical permissions:
  - `admin` - Full access to view and edit all data across all regions
  - `MCHS` - Can view all data but read-only (no create/update/delete)
  - `DCHS` - Can view and edit data only within their assigned region
  - `OCHS` - Can view and edit data only within their assigned district
- **API Design**: RESTful with middleware for auth and authorization

## Data Storage
- **Database**: PostgreSQL 14+ (Neon serverless hosting)
- **Schema Management**: Drizzle migrations
- **Session Management**: connect-pg-simple
- **Logging**: Audit logging for user actions
- **Structure**: Hierarchical organization (district -> region -> republic)

## Key Architectural Patterns
- **Shared Schema**: Drizzle with Zod for client/server type safety
- **Type-safe API**: Full TypeScript coverage
- **Modularity**: Reusable UI components
- **Data Access**: Repository pattern
- **Request Processing**: Middleware for authentication, validation, error handling

## Business Logic Structure
- **Incident Management**: Central logging for fire events
- **Report Generation**: Automated statistical forms (1-ОСП, 2-ССГ, 3-СПВП, 4-СОВП, 5-СПЖС, 6-ССПЗ, CO)
- **Package Workflow**: Multi-level approval for data submission
- **Hierarchical Reporting**: Data aggregation across organizational tree
- **Audit Trail**: Tracking of system interactions
- **Calculators**: Fire safety calculators for extinguishers, NGPS/PSS requirements, and explosion hazard categories.
- **AI Assistant**: Chatbot using GPT-4o-mini for consultations on regulatory acts and fire safety.
  - **Dynamic NPA Loading**: System prompt dynamically loads all normative documents from database at each request
  - **Source Citations**: All responses must include НПА name, number, and link to adilet.zan.kz
  - **Temperature**: 0.3 for accurate, fact-based responses
  - **Implementation**: `server/replit_integrations/chat/routes.ts`
- **Administrative Practice Module**: Full CRUD for administrative cases with journal and reporting.
  - **KoAP Articles**: ст.410, ст.410-1, ст.336, ст.359, ст.367, ст.438, ст.589
  - **Form Component**: `client/src/components/admin-practices/admin-case-form.tsx`
  - **Journal Page**: `client/src/pages/admin-practices.tsx`
  - **Report Controller**: `server/controllers/admin-practice-report.controller.ts`
  - **Enums**: paymentType (voluntary/forced), outcome (warning/termination/other), status (opened/in_review/resolved/closed/canceled)

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL serverless hosting
- **@neondatabase/serverless**: WebSocket-based connection pooling

## Authentication & Session Management
- **Replit Authentication**: OpenID Connect integration
- **Passport.js**: Authentication middleware
- **connect-pg-simple**: PostgreSQL session storage
- **Express Session**: Server-side session management

## UI & Styling Framework
- **Radix UI**: Accessible component primitives
- **TailwindCSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **date-fns**: Date manipulation and formatting

## Development & Build Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler
- **PostCSS**: CSS processing

## Data Management & Validation
- **Drizzle ORM**: Type-safe database toolkit
- **Zod**: Runtime type validation
- **React Hook Form**: Form state management
- **TanStack Query**: Server state management and caching

## Additional Integrations
- **Chart.js**: Data visualization
- **Leaflet.js**: Interactive maps via CDN (v1.9.4) for geospatial visualization
- **Nominatim API**: Address geocoding for coordinate lookup
- **Replit Development**: Hot reload and development environment
- **OpenAI**: Integrated via Replit AI Integrations for the AI Assistant.

## Interactive Maps Feature
- **Map Component**: LeafletMap component at `client/src/components/maps/leaflet-map.tsx`
- **Page**: Interactive maps page at `/maps`
- **Database Tables**: 
  - `incidents` table extended with `latitude` and `longitude` fields
  - `control_objects` table for supervised facilities with coordinates, status, and risk levels
- **API Endpoints**:
  - `GET /api/maps/data` - Returns incidents with coordinates for map display
  - `GET /api/control-objects` - Returns full control objects data; use `?format=map` for map-optimized format
  - `POST/PUT/DELETE /api/control-objects` - CRUD operations for control objects
- **Control Supervision Registry**: Full database-backed CRUD at `/control-supervision` page
  - Data stored in PostgreSQL via `control_objects` table
  - Supports Excel import/export
  - Real-time sync via TanStack Query mutations
- **Coordinate Input Methods**:
  1. Manual latitude/longitude entry in incident form
  2. Click on map to select coordinates
  3. Address geocoding via Nominatim OpenStreetMap API
- **Map Features**: Layer toggles, region filtering, marker popups with incident/object details, Kazakhstan boundary limits
- **Location Picker**: Modal component at `client/src/components/maps/location-picker.tsx` for selecting coordinates in forms
  - Loading indicator while Leaflet initializes
  - Error handling with retry functionality
  - Address search via Nominatim API

# Recent Changes

## February 5, 2026 - Map Component Fixes
- **LocationPicker**: Fixed map not loading in modal dialog when adding new incident
  - Added loading indicator while Leaflet library initializes
  - Added error state with retry button
  - Improved Leaflet loading wait logic with max attempts (50 x 100ms)
  - Added proper cleanup on dialog close
  - Added accessibility improvements (aria-describedby)
- **LeafletMap**: Fixed map disappearing when clicking "Mark on map" button
  - Fixed map initialization to properly wait for Leaflet
  - Added loading overlay during map initialization
  - Fixed marker deletion logic (was using invalid .remove() method)
  - Added proper map.invalidateSize() call after initialization
  - Preserved onMapClick callback for external integrations
  - Added DialogDescription for accessibility

## February 5, 2026 - Theme Color Fixes
- **control-supervision.tsx**: Replaced all hardcoded slate colors with semantic theme tokens
  - `bg-slate-950` → `bg-background`
  - `bg-slate-900/40` → `bg-card`
  - `bg-slate-800/900` → `bg-muted`
  - `text-slate-*` → `text-foreground`, `text-muted-foreground`
  - `border-slate-*` → `border-border`
  - `hover:bg-slate-*` → `hover:bg-accent`
- **audit-conclusions-journal.tsx**: Same color token replacements applied
- Both pages now correctly support light/dark theme switching via CSS variables