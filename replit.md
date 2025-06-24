# Access Valet Parking Management System

## Overview

This is a comprehensive valet parking shift management system built for restaurant clients including The Capital Grille, Bob's Steak and Chop House, Truluck's, and BOA Steakhouse. The application provides both employee and admin interfaces for shift reporting, employee management, and financial tracking.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **File Uploads**: Multer for handling multipart/form-data
- **Email**: Nodemailer with configurable SMTP providers

### Data Storage Solutions
- **Primary Database**: PostgreSQL (Neon serverless)
- **File Storage**: Local filesystem for uploaded documents/images
- **Session Storage**: PostgreSQL-based sessions using connect-pg-simple
- **Client Storage**: localStorage for authentication state

## Key Components

### Employee Management
- Employee records with SSN-based key generation
- Payroll tracking with commission and tip calculations
- Shift leader designation and active status management
- Contact information and hire date tracking

### Shift Reporting
- Location-specific shift reports (Lunch/Dinner)
- Financial tracking (cash, credit card, receipts)
- Employee hour logging with automatic payroll calculations
- Manager assignment and notes

### Location Management
- Four restaurant locations with unique configurations
- Location-specific reporting and analytics
- Ticket distribution tracking per location

### Authentication System
- Admin authentication with configurable session timeout
- Employee login using employee ID and last 4 SSN digits
- Biometric authentication support for compatible devices

### Mobile Optimization
- Responsive design with mobile-first approach
- Platform-specific handling for iOS devices
- Progressive Web App capabilities

## Data Flow

1. **Shift Entry**: Managers submit shift reports through location-specific forms
2. **Employee Tracking**: System automatically calculates payroll based on shift data
3. **Financial Processing**: Real-time calculations for commissions, tips, and taxes
4. **Data Validation**: Server-side validation prevents data integrity issues
5. **Reporting**: Admin dashboard provides comprehensive analytics and export capabilities

## External Dependencies

### Core Dependencies
- `@neondatabase/serverless`: PostgreSQL database connection
- `drizzle-orm`: Type-safe database operations
- `@tanstack/react-query`: Server state management
- `@radix-ui/*`: UI component primitives
- `react-hook-form`: Form state management
- `zod`: Runtime type validation

### Email Integration
- `nodemailer`: Email sending capability
- `@sendgrid/mail`: Alternative email provider

### File Processing
- `multer`: File upload handling
- Support for PDF documents and images

## Deployment Strategy

- **Platform**: Replit with autoscale deployment
- **Database**: Neon PostgreSQL serverless
- **Build Process**: Vite production build with Express server bundling
- **Environment**: Node.js 20 with PostgreSQL 16 module
- **Port Configuration**: Internal port 5000, external port 80

## Recent Changes

- June 24, 2025: Added standard time format conversion - times now display as 12-hour format with AM/PM instead of military time
- June 24, 2025: Fine-tuned Trulucks temporary zone coordinates - Event date: x:135, y:350; From time: x:75, To time: x:175, y:335
- June 24, 2025: Simplified Temporary Valet Zone form - removed unnecessary fields, only shows location selection and event details
- June 24, 2025: Reworked Temporary Valet Zone application to work like Annual Renewal system with location-specific templates
- June 24, 2025: Added Trulucks temporary zone PDF template with location-based coordinate mapping
- June 24, 2025: Temporary Zone app now includes location selection dropdown with preset data for all 4 restaurants
- June 24, 2025: Bob's Resolution of Authority date coordinates fine-tuned to x:120 (month/day) and x:245 (year)
- June 24, 2025: Added Bob's Resolution of Authority date field - splits date into month/day and year format on page 5
- June 24, 2025: Added Bob's PDF template for location-specific Annual Renewal generation - all 4 locations now complete
- June 24, 2025: Added BOA PDF template for location-specific Annual Renewal generation  
- June 24, 2025: Added Trulucks PDF template for location-specific Annual Renewal generation
- June 24, 2025: Added 5-category document upload system to Annual Renewal generator
- June 24, 2025: Document categories: Authorized Agent, Resolution of Authority, Valet Insurance, Business Insurance, Parking Agreement
- June 24, 2025: Fixed PDF document merging - uploads now seamlessly integrated as additional pages
- June 24, 2025: Created Capital Grille Renewal PDF editor with three editable date fields
- June 24, 2025: Fixed PDF template loading and text overlay positioning system
- June 24, 2025: Fine-tuned text positioning coordinates for precise form field alignment
- June 24, 2025: Added comprehensive contract generation system with PDF export and company logo
- June 24, 2025: Contract generator includes customizable termination notice periods (30/60/90 days)
- June 24, 2025: Removed trial period functionality - streamlined for general contract use
- June 24, 2025: Updated home screen logo to new tire gear design with enhanced quality rendering
- June 24, 2025: Version 2.1.2 - Fixed complex JSON parsing for previous week hours - resolved multi-employee data extraction
- June 24, 2025: Enhanced parseEmployeesData function with regex-based JSON object extraction
- June 24, 2025: Hours tracker now correctly displays all employee hours across different data formats
- June 23, 2025: Fixed hours tracker in admin panel - resolved JSON parsing issues for employee hours data
- June 23, 2025: Updated hours tracker to handle multiple employee data formats from database
- June 23, 2025: Hours tracker now correctly displays weekly employee hours and overtime alerts
- June 23, 2025: Initial system setup with automated versioning

## User Preferences

Preferred communication style: Simple, everyday language.