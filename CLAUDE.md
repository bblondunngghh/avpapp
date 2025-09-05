# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Development Commands

### Running the Application
```bash
# Run both frontend and backend simultaneously (recommended)
npm run dev:all

# Run backend only
npm run dev:backend
# or
npm run dev

# Run frontend only  
npm run dev:frontend

# Build for production
npm run build

# Start production server
npm start

# Type checking (CRITICAL: Always run before committing)
npm run check

# Database migrations
npm run db:push

# Railway deployment
npm run railway:start
```

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js with TypeScript (tsx for development, esbuild for production)
- **Database**: PostgreSQL with Drizzle ORM (Neon serverless)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter (client), Express (server)
- **State Management**: TanStack Query (React Query)
- **Authentication**: Express sessions with passport-local + connect-pg-simple
- **File Handling**: Multer for uploads, Sharp for image processing
- **External Services**: Square API, Twilio SMS, SendGrid email, Web Push notifications

### Project Structure
```
AVApp/
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   │   └── ui/       # shadcn/ui component library
│   │   ├── pages/        # Route-based page components
│   │   ├── lib/          # Utilities and services (queryClient, etc.)
│   │   └── assets/       # Images and static files
├── server/           # Backend Express server
│   ├── index.ts      # Server entry point with middleware setup
│   ├── routes.ts     # API route definitions
│   ├── db.ts         # Database connection (Neon PostgreSQL)
│   ├── storage.ts    # Data access layer interface
│   ├── vite.ts       # Vite development setup
│   └── *.ts          # Additional services (backup, square, etc.)
├── shared/           # Shared types and schemas
│   └── schema.ts     # Drizzle ORM schemas & Zod validation
├── migrations/       # Database migration files
├── uploads/          # File upload storage directory
└── dist/             # Production build output
```

### Key Architectural Patterns

1. **Database Access**: Uses Drizzle ORM with PostgreSQL (Neon serverless). All database schemas are defined in `shared/schema.ts` with corresponding Zod validation schemas. Includes retry logic via `withRetry()` wrapper.

2. **API Pattern**: RESTful API endpoints defined in `server/routes.ts` with comprehensive validation middleware. All API routes are prefixed with `/api`. Uses IStorage interface pattern for data operations.

3. **Type Safety**: Full TypeScript coverage with shared types between frontend and backend via the `shared/` directory. Path aliases configured: `@/*` for client, `@shared/*` for shared.

4. **Component Architecture**: Uses shadcn/ui components in `client/src/components/ui/` with custom business components. Glassmorphism design system with specific styling requirements (see UI/UX Standards).

5. **Routing**: Client-side routing with Wouter, server-side routing with Express. Device-aware routing (mobile vs desktop admin panels). Admin routes protected with authentication guards and auto-logout on inactivity.

6. **Error Handling**: Comprehensive error handling with logging, database connection resilience, and graceful degradation.

## 🎨 UI/UX Standards

### Glassmorphism Card Styling
**CRITICAL**: Use this EXACT glassmorphism styling for ALL cards going forward:

**⚠️ IMPORTANT NOTE**: Always use `<div>` elements instead of `<Card>` components for glassmorphism effects. Card components have default backgrounds that override the glassmorphism styling. The exact background tint and visual appearance ONLY works with div elements.

**Main Container Cards (EXACT SPECIFICATION):**
```jsx
<div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl">
  {/* Glass morphism overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-xl"></div>
  
  {/* Content with z-index */}
  <div className="relative z-10 p-6">
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white mb-2">Your Title</h2>
      <p className="text-slate-400">Your description</p>
    </div>
    {/* Your content here */}
  </div>
</div>
```

**Buttons within glassmorphism cards:**
```jsx
<Button className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
  Button Text
</Button>
```

**Modal/Dialog glassmorphism styling:**
```jsx
<DialogContent className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl">
  {/* Glass morphism overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-xl"></div>
  
  <div className="relative z-10 p-6">
    {/* Modal content */}
  </div>
</DialogContent>
```

**Modal positioning CSS (include in style tag):**
```css
[data-radix-dialog-content] {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  max-height: 85vh !important;
  overflow-y: auto !important;
  z-index: 9999 !important;
}
[data-radix-dialog-overlay] {
  z-index: 9998 !important;
}
```

### Design Principles
- Use semi-transparent backgrounds with backdrop blur for modern glass effect
- Consistent spacing with `p-4` padding and `mt-6` margin between sections
- Dark theme with slate color palette
- Responsive design with mobile-first approach

## 📦 Key Dependencies

### Frontend
- React 18 with React Hook Form for forms
- TanStack Query for server state management
- Tailwind CSS + shadcn/ui for styling
- Lucide React for icons
- Recharts for data visualization
- date-fns for date manipulation

### Backend
- Express.js with TypeScript
- Drizzle ORM for database operations
- Passport.js for authentication
- Multer for file uploads
- SendGrid/Nodemailer for emails
- Twilio for SMS
- Web Push for notifications

## 🔐 Authentication & Security

- Session-based authentication using express-session
- Passport Local strategy for admin login
- Protected admin routes with authentication guards
- Employee login with key-based authentication
- Environment variables for sensitive configuration

## 📱 Mobile Support

The app includes specialized mobile views:
- Responsive design for all screen sizes
- Dedicated mobile admin panel (`mobile-admin-panel.tsx`)
- Simplified mobile admin for iOS (`simple-mobile-admin.tsx`)
- Bottom navigation for mobile devices
- Touch-optimized UI components

## 🗄️ Database Schema

Key tables defined in `shared/schema.ts` (comprehensive valet parking management system):

### Core Business Tables
- `locations` - Restaurant client locations with rates and contact info
- `employees` - Employee records with payroll data, keys, and personal info
- `shiftReports` - Daily shift reports with car counts and financial data
- `employeeShiftPayroll` - Individual employee payroll per shift
- `companyPayrollData` - Company-level payroll summaries
- `employeePayrollData` - Detailed employee earnings tracking

### Operations & Support
- `helpRequests` & `helpResponses` - Inter-location help coordination system
- `incidentReports` - Accident/incident documentation with photos
- `coverCountReports` - Daily evening service predictions
- `permits` - Parking permits with PDF storage
- `ticketDistributions` - Ticket allocation and usage tracking

### Administrative
- `users` - Admin authentication
- `pushSubscriptions` - Web push notification endpoints
- `trainingAcknowledgments` - Digital training completion records
- `documentAttachments` - File storage for various document categories
- `employeeTaxPayments` - Tax payment tracking
- `shifts`, `timeOffRequests`, `scheduleTemplates` - Staff scheduling system

## 🔧 Development Guidelines

### Critical Requirements
1. **Type Checking**: ALWAYS run `npm run check` before committing - TypeScript errors will break the build
2. **Glassmorphism Styling**: Follow the exact glassmorphism patterns specified above - use `<div>` elements, not `<Card>` components
3. **Database Safety**: Use `withRetry()` wrapper for database operations to handle connection issues
4. **Mobile Responsiveness**: Test on mobile devices - different admin panels for desktop/iPad vs iPhone

### Development Workflow
1. **Database Changes**: Use `npm run db:push` for schema changes, never edit migrations directly
2. **Environment Variables**: Ensure `DATABASE_URL` is set in `.env` file
3. **File Uploads**: Files stored in `uploads/` directory, served at `/uploads/*` route
4. **Error Handling**: All API routes have comprehensive error handling and logging
5. **Session Management**: Uses PostgreSQL-backed sessions with automatic cleanup

### Component Development
1. Use existing shadcn/ui components from `client/src/components/ui/`
2. Follow the established glassmorphism design patterns
3. Ensure mobile responsiveness and touch optimization
4. Use TanStack Query for all API calls with proper error boundaries

## 📂 Critical Files & Locations

### Backend Core
- `server/index.ts` - Main server entry with middleware setup and error handling
- `server/routes.ts` - All API endpoint definitions with validation
- `server/storage.ts` - Database access layer implementing IStorage interface  
- `server/db.ts` - Database connection with retry logic and session store
- `shared/schema.ts` - Complete database schema with Zod validation (768 lines)

### Frontend Core  
- `client/src/App.tsx` - Main app with device-aware routing and auto-logout
- `client/src/pages/admin-panel.tsx` - Desktop admin interface
- `client/src/pages/mobile-admin-panel.tsx` - Mobile-optimized admin
- `client/src/components/ui/` - Complete shadcn/ui component library

### Configuration
- `vite.config.ts` - Frontend build configuration with path aliases
- `drizzle.config.ts` - Database migrations and schema management  
- `tsconfig.json` - TypeScript configuration with path mapping
- `tailwind.config.ts` - Styling configuration with glassmorphism support

### Deployment
- `package.json` - All scripts including `railway:start` for deployment
- `uploads/` - File storage directory (created at runtime)