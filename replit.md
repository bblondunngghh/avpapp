# Access Valet Parking Management System

## Overview
Access Valet Parking Management System is a comprehensive solution designed for restaurant clients like The Capital Grille, Bob's Steak and Chop House, Truluck's, and BOA Steakhouse. Its core purpose is to streamline valet parking shift management. The system provides intuitive interfaces for both employees and administrators, enabling efficient shift reporting, employee management, and financial tracking. The vision for this project is to revolutionize valet operations with a robust, scalable, and user-friendly platform, enhancing operational efficiency and financial transparency for businesses.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The system features a responsive design with a mobile-first approach, ensuring optimal usability across devices. It utilizes Radix UI components with Tailwind CSS for a modern and consistent aesthetic. Typography is carefully selected, with Open Sans used throughout for readability.

### Technical Implementations
- **Frontend**: React with TypeScript, Vite for bundling, Wouter for routing, TanStack Query for server state, and React Hook Form with Zod for robust form handling.
- **Backend**: Node.js with Express, PostgreSQL (Neon serverless) for data storage, and Drizzle ORM for type-safe database interactions. Multer handles file uploads, and Nodemailer manages email communications.
- **Authentication**: Secure admin authentication with configurable session timeouts and employee login via employee ID and SSN (last 4 digits). Biometric support is included for compatible devices.

### Feature Specifications
- **Employee Management**: Comprehensive employee records, payroll calculation (commission, tips), shift leader designation, and contact/hire date tracking. Includes driver's license, DOB, SSN fields, and MVR document upload. Automated email notifications to accountants upon new employee creation with complete data. Employee dashboard displays simplified earnings breakdown without tax obligation calculations for cleaner user experience.
- **Shift Reporting**: Location-specific shift reports (Lunch/Dinner), financial tracking (cash, credit, receipts), automated payroll calculation, and manager notes.
- **Location Management**: Support for four distinct restaurant locations with tailored configurations and reporting.
- **Financial Processing**: Real-time calculation of commissions, tips, and taxes.
- **Document Generation**: Advanced PDF generation system for temporary valet permits and annual renewals, with location-specific templates, dynamic date/time formatting, and integration of uploaded documents (e.g., certificates of insurance).
- **Assistance Center**: Real-time inter-location help request system with urgent notification capabilities (SMS, push notifications with sound) and status tracking.
- **Reporting & Analytics**: Admin dashboard offers comprehensive reporting, including employee accounting overviews and cover count displays with color-coded status labels ("Slow", "Average", "Busy").

### System Design Choices
- **Database Schema**: Optimized for efficient storage and retrieval of employee, shift, and financial data using PostgreSQL.
- **API Design**: RESTful APIs for seamless communication between frontend and backend services.
- **Scalability**: Designed for scalability with serverless PostgreSQL and a Node.js Express backend.
- **Error Handling**: Robust server-side validation and error handling for data integrity.

## External Dependencies

- **Database**: `@neondatabase/serverless` (PostgreSQL via Neon)
- **ORM**: `drizzle-orm`
- **UI Components**: `@radix-ui/*`
- **State Management**: `@tanstack/react-query`
- **Form Management**: `react-hook-form`, `zod`
- **Email**: `nodemailer`, `@sendgrid/mail`
- **File Uploads**: `multer`
- **Session Management**: `connect-pg-simple`