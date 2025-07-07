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
- July 2, 2025: CRITICAL BUG FIX - Fixed employee breakdown displaying generic names ("employee 1", "employee 2") instead of actual names for employees added via admin panel. Root cause was hardcoded name mapping in shift report form that didn't include admin-added employees. Fixed by implementing dynamic employee lookup from database with fallback to legacy mapping. Now properly displays actual names like "Braden Baldez" and "Jack Shelton" instead of generic placeholders.
- July 2, 2025: COMPLETE TAX REMOVAL - Eliminated all 22% tax calculations and tax summary sections from shift report submission complete page. Removed tax-related state, calculations, UI components, and logging for cleaner completion experience without tax references.
- July 2, 2025: Updated Capital Grille icon in location selector modal to use stove gas icon for better visual identification in shift report creation workflow.
- July 2, 2025: Implemented comprehensive employee training completion gate that blocks all dashboard access until mandatory safety training is completed. Added full overlay with blur effect and direct training completion link.
- July 2, 2025: Temporarily disabled backup service to resolve development server stability issues caused by WebSocket conflicts between Vite HMR and Neon database connections.
- July 3, 2025: CRITICAL BUG FIX - Fixed text notification delivery failures in assistance center by implementing reliable single-gateway SMS delivery system. The issue was that single email-to-SMS gateways were unreliable and causing bounce-back notifications to `brandon@accessvaletparking.com`. Solution: (1) Enhanced email service to automatically detect SMS scenarios and send plain text messages, (2) Updated all 4 restaurant locations to use direct phone number approach with T-Mobile gateway (@tmomail.net), (3) Removed multi-gateway flooding approach that was overwhelming email inbox. System now sends one reliable text message per notification request.
- July 3, 2025: CRITICAL BUG FIX - Fixed push notification section not appearing on mobile devices after deployment due to aggressive browser caching and service worker persistence. Implemented mobile-specific cache busting with service worker versioning (v1.1.0), automatic service worker updates for mobile devices, and session-based refresh logic to prevent repeated updates while ensuring proper cache clearing. Mobile devices now automatically force service worker re-registration with timestamp-based cache busting.
- July 3, 2025: CRITICAL BUG FIX - Fixed P-256 public key error in push notifications by generating proper VAPID keys and implementing web-push library. Added loud notification sounds that play when push notifications are received, including programmatic audio generation using Web Audio API. Created test sound button in push notification setup for users to preview notification audio before subscribing. Enhanced service worker to communicate with client for sound playback and added user interaction detection to enable audio context.
- July 3, 2025: MAJOR ENHANCEMENT - Implemented urgent notification system with maximum volume (100% instead of 80%) using aggressive compression and square wave tones for piercing alarm effect. Created continuous notification service that sends urgent notifications every 30 seconds for 3 minutes until valet attendant is dispatched. System automatically monitors help responses and stops notifications when assistance is confirmed dispatched. Enhanced notification sound with siren-like rapid-fire alarm sequence using frequencies from 600Hz to 1500Hz for maximum urgency.
- July 3, 2025: MAJOR ENHANCEMENT - Created assistance center popup notification window to inform users about new operational features. Popup displays for 5 days (July 3-8, 2025) with detailed usage instructions, custom application icons (insurance hand, delivery man, send email, athletics team, task list question, check complete icons), and localStorage-based dismissal tracking. Includes direct navigation to assistance center and professional styling with blue color scheme matching application design.
- July 3, 2025: CRITICAL BUG FIX - Fixed help request card button layout overflow issues with responsive design. Changed button text from "Respond to [Location Name]" to "Respond" and implemented mobile-friendly stacking layout with proper spacing. Buttons now use flex-shrink-0 to prevent compression and display correctly within card boundaries across all device sizes.
- July 3, 2025: CRITICAL BUG FIX - Fixed requesting device receiving notification sounds for its own help requests. Modified continuous notification service to accept isOwnRequest flag that excludes originating device from playing notification sounds while preserving urgent alerts for all other locations. System now properly prevents self-notifications while maintaining 30-second interval alerts for responding locations.
- July 3, 2025: ENHANCEMENT - Removed assistance center popup notification window from home page per user request. Popup component disabled in main App.tsx to provide cleaner home page experience while maintaining all assistance center functionality through navigation menu.
- July 3, 2025: DESIGN UPDATE - Replaced Fjalla One font with SF Pro throughout the application. Updated all CSS classes and global styles to use Apple's SF Pro font stack (-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text') with system font fallbacks for optimal native appearance on iOS devices and cross-platform compatibility.
- July 3, 2025: UI IMPROVEMENT - Removed all caps formatting from "Access Valet Parking" title in top navigation header. Changed from "ACCESS VALET PARKING" to "Access Valet Parking" for better readability and professional appearance.
- July 3, 2025: TYPOGRAPHY ENHANCEMENT - Made "Access Valet Parking" title bold in navigation header. Updated font-weight from 600 (semi-bold) to 700 (bold) for stronger visual presence while maintaining text-xl size (20px).
- July 3, 2025: FONT SIZE UPDATE - Increased "Access Valet Parking" title font size from 20px (text-xl) to 23px for better prominence in navigation header.
- July 3, 2025: TYPOGRAPHY REFINEMENT - Optimized "Access Valet Parking" title styling for better visual appeal: adjusted size to 22px, reduced weight to 600 (semi-bold), refined letter spacing to 0.5px, enhanced text shadow, and added line-height for cleaner appearance.
- July 3, 2025: TEXT FORMATTING UPDATE - Reverted navigation title back to all caps "ACCESS VALET PARKING" per user preference while maintaining the refined typography styling (22px, semi-bold, optimized spacing).
- July 3, 2025: FONT WEIGHT UPDATE - Changed "ACCESS VALET PARKING" title from semi-bold (600) to full bold (700) for stronger visual presence in navigation header.
- July 3, 2025: MAJOR FONT UPDATE - Replaced SF Pro font with Open Sans throughout the entire application. Updated all CSS classes, global styles, and font family references to use Open Sans as the primary font with system fallbacks for better cross-platform compatibility and readability.
- July 3, 2025: CRITICAL BUG FIX - Removed remaining tax validation logic from shift report submission that was causing "Insufficient Tax Payment" errors. The system was still checking for tax obligations despite tax sections being removed from the UI. Fixed by eliminating the entire tax validation block that was preventing successful shift report submissions.
- July 3, 2025: UI IMPROVEMENT - Removed Email column from employee management table display in admin panel. Email data is still stored and accessible in employee edit dialogs but no longer clutters the main employee table view for cleaner presentation.
- July 3, 2025: TABLE FORMATTING UPDATE - Enhanced employee management table in admin panel: Added min-width and whitespace-nowrap to phone number column to prevent text wrapping, centered training complete column header and icons for better visual alignment.
- July 2, 2025: Added comprehensive tax policy update notice to shift report submission complete page explaining elimination of 22% tax requirement, potential for future changes, and redistribution process for any money owed via taxes and direct deposit/check payments.
- July 2, 2025: CRITICAL BUG FIX - Fixed full SSN field not saving in employee edit dialog in admin panel. Issue was form initialization setting fullSsn to empty string instead of loading existing employee.fullSsn value. Now properly preserves and allows editing of full SSN data.
- July 2, 2025: Enhanced phone number input fields in admin panel with automatic dash formatting (XXX-XXX-XXXX). Added consistent formatting to both Add Employee and Edit Employee dialogs, matching the date of birth field behavior for improved user experience.
- July 2, 2025: Added comprehensive tax policy update notice to shift reports view under employee earnings breakdown. Notice explains elimination of 22% tax requirement, money redistribution process, and potential for future policy changes, providing transparency for all account holders viewing shift reports.
- July 2, 2025: Added tax policy notice to shift report creation form under employee earnings breakdown section. Now appears during shift report creation process when managers review individual employee commission, tips, money owed, and total earnings calculations.
- July 2, 2025: Implemented automatic 30-day removal system for tax policy notices. Both shift report creation form and completed shift reports will automatically hide the tax policy notice after 30 calendar days from July 2, 2025 (removal date: August 1, 2025).
- July 2, 2025: CRITICAL BUG FIX - Fixed Employee Accounting tab to properly display separate Credit Card Tips and Cash Tips columns instead of showing $0.00 values. Issue was data flow problem where sorting logic was running on stale data before tip calculations completed. Implemented proper useMemo hook for sorting after calculations, now correctly shows individual credit and cash tip amounts (e.g., Antonio Martinez: $46.00 credit tips, $9.00 cash tips).
- July 2, 2025: CRITICAL BUG FIX - Fixed training completion detection not updating after employees complete training forms. Enhanced name matching logic to handle partial names and case differences (e.g., "Brett" matches "Brett Willson"). Added "Refresh Training Status" button in admin panel to manually update training acknowledgments data. Fixed both admin Employees tab and employee login section training status displays.
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