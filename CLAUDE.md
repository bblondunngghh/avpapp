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

# Type checking
npm run check

# Database migrations
npm run db:push
```

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js with TypeScript (tsx for development)
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter (client), Express (server)
- **State Management**: TanStack Query (React Query)
- **Authentication**: Express sessions with passport-local

### Project Structure
```
AVApp/
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-based page components
│   │   ├── lib/          # Utilities and services
│   │   └── assets/       # Images and static files
├── server/           # Backend Express server
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── db.ts         # Database connection
│   └── storage.ts    # Data access layer
├── shared/           # Shared types and schemas
│   └── schema.ts     # Drizzle ORM schemas & Zod validation
└── migrations/       # Database migration files
```

### Key Architectural Patterns

1. **Database Access**: Uses Drizzle ORM with PostgreSQL. All database schemas are defined in `shared/schema.ts` with corresponding Zod validation schemas.

2. **API Pattern**: RESTful API endpoints defined in `server/routes.ts` with validation middleware. All API routes are prefixed with `/api`.

3. **Type Safety**: Full TypeScript coverage with shared types between frontend and backend via the `shared/` directory.

4. **Component Architecture**: Uses shadcn/ui components in `client/src/components/ui/` with custom business components in `client/src/components/`.

5. **Routing**: Client-side routing with Wouter, server-side routing with Express. Admin routes are protected with authentication guards.

## 🎨 UI/UX Standards

### Glassmorphism Card Styling
**CRITICAL**: Use this EXACT glassmorphism styling for ALL cards going forward:

**⚠️ IMPORTANT NOTE**: Always use `<div>` elements instead of `<Card>` components for glassmorphism effects. Card components have default backgrounds that override the glassmorphism styling. The exact background tint and visual appearance ONLY works with div elements.

**Main Container Cards (EXACT SPECIFICATION):**
```jsx
<div className="relative overflow-hidden bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-indigo-900/80 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl p-6">
  {/* Enhanced Glass morphism overlay */}
  <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
  
  {/* Background Pattern */}
  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
  
  {/* Content with z-index */}
  <div className="relative z-10">
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
<DialogContent className="relative overflow-hidden bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-indigo-900/80 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl">
  {/* Same overlay pattern as main cards */}
  <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
  
  <div className="relative z-10">
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

Key tables defined in `shared/schema.ts`:
- `users` - Admin users
- `employees` - Employee records with payroll data
- `shiftReports` - Daily shift reports
- `ticketDistributions` - Ticket/car distribution data
- `incidents` - Incident reports
- `helpRequests` - Employee help requests
- `documents` - Uploaded documents

## 🔧 Development Tips

1. **Type Checking**: Always run `npm run check` before committing to catch TypeScript errors
2. **Database Changes**: Use Drizzle Kit for migrations (`npm run db:push`)
3. **Environment Variables**: Required DATABASE_URL in `.env` file
4. **File Uploads**: Stored in `uploads/` directory, served statically
5. **API Testing**: All API routes accessible at `/api/*`
6. **Component Development**: Use existing shadcn/ui components when possible

## 📂 Important Files

- `server/routes.ts` - All API endpoint definitions
- `server/storage.ts` - Database queries and business logic
- `client/src/App.tsx` - Main app component with routing
- `shared/schema.ts` - Database schemas and types
- `drizzle.config.ts` - Database configuration