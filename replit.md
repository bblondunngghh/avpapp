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

- July 1, 2025: Updated Employee Accounting tab to sort employees alphabetically by last name instead of first name for better organization
- July 1, 2025: Optimized iPad navigation to use hamburger menu exclusively, hiding top navigation buttons for cleaner interface
- July 1, 2025: iPad hamburger menu positioned on right edge aligned with page content for better UX
- July 1, 2025: Updated hamburger menu icon to use custom layout headline icon for both mobile and iPad navigation
- July 2, 2025: Added enhanced employee management features: Driver's License Number field, Date of Birth field, full SSN field, and motor vehicle records document upload capability to admin panel
- July 2, 2025: CRITICAL BUG FIX - Fixed additional tax payments calculation showing company cash turn-in amount instead of actual employee tax payments. Issue was in string-to-number conversion during aggregation.
- July 2, 2025: CRITICAL BUG FIX - Fixed employee breakdown displaying generic names ("employee 1", "employee 2") instead of actual names for employees added via admin panel. Enhanced matchEmployee function to handle generic employee names and added special mappings for Braden Baldez and Jack Shelton. This is a systematic issue where the shift report form generates generic names for admin-added employees.
- July 1, 2025: Added "Assistance Center" icon and link to mobile bottom navigation bar for easy access on mobile devices
- July 1, 2025: Added "Home" text to home button alongside house icon for better user clarity
- July 1, 2025: Removed icon from "Access Valet Assistance Center" page title for cleaner appearance
- July 1, 2025: Renamed section header within page from "Assistance Center" to "Help Request Center" to clarify functionality
- July 1, 2025: Renamed page title from "Inter-Location Help Requests" to "Access Valet Assistance Center" for clearer branding
- July 1, 2025: Renamed "Help Request Center" to "Assistance Center" and moved to top navigation bar with icon for better accessibility
- July 1, 2025: Added Lock Shield icon to Admin Login button in navigation to maintain visual consistency with new Assistance Center button
- July 1, 2025: Removed Help Request button from dashboard home page and integrated into persistent header navigation
- July 1, 2025: CRITICAL FIX - Resolved timezone bug causing June 1st data to appear as May 31st in Employee Accounting
- July 1, 2025: Fixed all unsafe date parsing in admin panel (14 instances) - replaced new Date() with parseLocalDate()
- July 1, 2025: Repaired 46+ malformed employee shift records from June 20-30 with corrupted JSON format
- July 1, 2025: Notification system fully operational with T-Mobile gateway (5127755739@tmomail.net)
- July 1, 2025: Added backup web notifications route at /notifications for help request access
- June 30, 2025: Added color coding to cover count displays - green for under 100 covers, yellow for 100-200 covers, red for over 200 covers
- June 30, 2025: Added status labels to cover counts: "Slow" (green), "Average" (yellow), and "Busy" (red) for quick business volume assessment
- June 30, 2025: Replaced Help Request Center icons with custom graphics - rabbit running icon for "Active Help Requests", insurance hand icon for "Help Request Center", book icon for "Daily Cover Count Reports", athletics team running icon for "Request Help" section, and send email icon for "Submit Cover Count Report" functionality
- June 30, 2025: Reduced auto-remove timer from 15 minutes to 5 minutes for completed help requests
- June 30, 2025: Repositioned "Completed" button to right side of help request containers using justify-between layout for better visual balance
- June 30, 2025: Version 2.1.3 - Updated version number for deployment with UI improvements and security enhancements
- June 30, 2025: Removed "View Sales Demo" button from dashboard home screen to prevent staff access to demo features
- June 30, 2025: Removed debugging text "(state:true/false)" from shift leader checkbox in employee edit dialog for cleaner UI
- June 30, 2025: Fixed Employee Accounting Overview to include inactive employees for complete financial audit compliance
- June 30, 2025: Added /api/employees/all endpoint to preserve payroll data visibility for deactivated employees
- June 27, 2025: Updated home screen blue container design to match tile styling with grey accent bar
- June 27, 2025: Positioned version number at bottom-right corner of blue container using Fjalla One font
- June 27, 2025: Removed grey accent bar and relocated version display to container bottom
- June 27, 2025: Diagnosed CSV export bug - field name mismatch between database 'manager' column and code 'shiftLeader' reference
- June 24, 2025: PDF filename now uses event description (e.g., "Mothers_Day_2025_Temporary_Valet_Zone.pdf")
- June 24, 2025: Added event description field to temporary valet zone applications for event naming (e.g., "Mothers Day 2025")
- June 24, 2025: Extended certificate of insurance upload to all temporary permit locations (Trulucks, Capital Grille, BOA, Bob's)
- June 24, 2025: Certificate of insurance uploads now merge as additional pages in all temporary permit PDFs
- June 24, 2025: Added certificate of insurance upload field for Trulucks temporary permits
- June 24, 2025: Renamed 'Contracts' button to 'Document Generator' in admin panel for clarity
- June 24, 2025: Balanced pill-shaped ovals (xScale: width/1.8, yScale: 7) for better visibility and button-like appearance
- June 24, 2025: Removed unwanted page 2 text overlay from temporary valet PDF generator
- June 24, 2025: Adjusted Friday position to x:470 and reduced width to 35px for precise PDF alignment
- June 24, 2025: Fixed weekday coordinate mapping - rectangles now align correctly with PDF day positions
- June 24, 2025: Added standard time format conversion - times now display as 12-hour format with AM/PM instead of military time
- June 24, 2025: Fine-tuned Trulucks temporary zone coordinates - Event date: x:135, y:350; From time: x:75, To time: x:175, y:335
- June 24, 2025: Simplified Temporary Valet Zone form - removed unnecessary fields, only shows location selection and event details
- June 24, 2025: Reworked Temporary Valet Zone application to work like Annual Renewal system with location-specific templates
- June 25, 2025: Added "Export DW PDF" button for Capital Grille receipt sales report with date, shift, and totals
- June 25, 2025: Added BOA temporary zone PDF template with exact same minimal generator as Trulucks
- June 25, 2025: Added Bob's temporary zone PDF template with exact same minimal generator as Trulucks
- June 24, 2025: Capital Grille temp zone now uses exact same minimal generator as Trulucks (dates, times, weekday circles only)
- June 24, 2025: Updated Capital Grille temporary zone PDF template and removed extra text overlay from first page
- June 24, 2025: Added Capital Grille temporary zone PDF template with location-based coordinate mapping
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