# Planning Tool

A comprehensive web application for equipment management, exercise planning, and logistics tracking. Built with Next.js 14, TypeScript, and modern web technologies.

## Core Features

### Equipment Management
- Detailed equipment specifications tracking
- Equipment comparison tools
- Consumables and spares management
- FSR (Field Service Representative) scheduling
- Cost tracking and analysis
- Environmental specifications monitoring
- Integration capabilities tracking
- RF and EW specifications management
- Equipment repository with advanced filtering
- Detailed specification views
- Cost and support tracking
- Power management

### Systems Integration
- System composition tracking
- Equipment-to-system conversion
- Integration requirements management
- System comparison tools
- Cost aggregation and analysis
- Power requirements calculation
- Environmental compatibility checking
- Automated system creation from equipment
- Specification inheritance
- Component relationship mapping

### Exercise Planning
- Mission planning tools
- Resource allocation
- Equipment deployment tracking
- Personnel management
- Timeline creation and management
- Cost estimation
- Risk assessment
- After-action reporting
- Resource utilization tracking
- Environmental condition planning

### Consumables Tracking
- Usage monitoring
- Stock level management
- Reorder point tracking
- Cost analysis
- Supplier management
- Consumption rate analysis
- Budget forecasting
- Integration with equipment specifications
- Automated reordering system
- Usage history tracking

### Logistics Management
- Procurement tracking
- Lead time management
- Shipping requirements
- Refurbishment tracking
- Spares inventory
- Cost management
- Supplier relationships
- Transportation planning
- Storage requirements
- Maintenance scheduling

### User Management
- Role-based access control
- Permission management
- Activity logging
- User authentication
- Session management
- Security controls
- Access level tracking
- Audit trail
- Password security
- Token-based authentication

## Technical Specifications

### Equipment Data Structure
- Technical Specifications
  - Physical specifications
    - Dimensions (length, width, height)
    - Weight (base and loaded)
    - Units of measurement
  - Power specifications
    - Voltage requirements
    - Amperage ratings
    - Frequency specifications
  - Environmental specifications
    - Temperature ranges (min/max with units)
    - Humidity ranges (min/max with percentage)
  - Custom field support
    - User-defined specifications
    - Flexible field naming
    - Value tracking

- RF/EW Capabilities
  - Frequency ranges and bands
  - Power specifications
  - Sensitivity measurements
  - EW capabilities
  - Antenna specifications
  - Signal processing
  - Interference handling
  - Range capabilities

- Software Capabilities
  - GUI features
  - Control interfaces
  - Mission planning tools
  - Real-time analysis
  - Post-mission analysis
  - License management
  - Remote operation
  - Data export
  - Integration APIs
  - Update management

### Operations Management
- Deployment Methods
  - Fixed installation
  - Mobile deployment
  - Man-portable options
  - Vehicle mounting
  - Airborne capabilities
  - Maritime deployment
  - Rapid deployment
  - Emergency procedures

- Training Requirements
  - Required certifications
  - Optional training
  - Certification tracking
  - Training documentation
  - Skill assessments
  - Refresher requirements
  - Instructor qualifications

- Maintenance Planning
  - Scheduled maintenance
  - Unscheduled maintenance
  - Support requirements
  - Tool requirements
  - Spare parts management
  - Technical documentation
  - Repair procedures

### Exercise Data Structure
- Mission Planning
  - Timeline management
    - Start and end dates
    - Phase scheduling
    - Milestone tracking
  - Resource allocation
    - Equipment assignments
    - Personnel requirements
    - Support services
  - Environmental conditions
    - Temperature ranges
    - Humidity requirements
    - Weather considerations
  - Cost tracking
    - Equipment costs
    - Personnel costs
    - Support costs
    - Consumables
  - Risk assessment
    - Environmental factors
    - Resource availability
    - Technical limitations
    - Personnel readiness
  - After-action reporting
    - Resource utilization
    - Performance metrics
    - Issue tracking
    - Recommendations

## Technology Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod Validation
- Radix UI Components
- Recharts
- Lucide Icons
- PDF Generation
- CSV Export

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcrypt Password Hashing
- String Similarity Matching

### Development Tools
- TypeScript
- ESLint
- Prettier
- Prisma Studio
- Tailwind CSS
- PostCSS
- Autoprefixer
- AWS SDK

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn
- AWS Account (for S3 storage)
- Git

### Initial Setup

1. Clone the repository:
git clone https://github.com/jaw1999/military-planning-tool.git
cd military-planning-tool

2. Install dependencies:
npm install @aws-sdk/client-s3 @hookform/resolvers @prisma/client @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @shadcn/ui @tanstack/react-query axios bcrypt bcryptjs class-variance-authority clsx compromise date-fns debug decimal.js follow-redirects jsonwebtoken lucide-react natural next next-auth papaparse pdf-lib pdf-parse react react-dom react-hook-form recharts string-similarity supports-color tailwind-merge zod

3. Set up environment variables:
cp .env.example .env.local

4. Configure your .env.local with required variables:
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

# Authentication
JWT_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Application Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"

5. Initialize the database:
npx prisma generate
npx prisma db push

6. Start the development server:
npm run dev

7. Run database migrations:
npx prisma migrate dev

8. Seed the database (optional):
npx prisma db seed

### Production Deployment

1. Build the application:
npm run build

2. Start the production server:
npm start

### Development Tools Setup

1. Install development dependencies:
npm install -D @types/bcrypt @types/bcryptjs @types/jsonwebtoken @types/lodash @types/node @types/papaparse @types/react @types/react-dom @types/string-similarity @types/tailwindcss autoprefixer postcss prisma tailwindcss tailwindcss-animate typescript

2. Initialize TypeScript configuration:
npx tsc --init

3. Set up ESLint:
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npx eslint --init

4. Configure Prettier:
npm install -D prettier
echo {}> .prettierrc

5. Set up Prisma development tools:
npm install -D prisma
npx prisma init

6. Install testing framework:
npm install -D jest @types/jest ts-jest
npx ts-jest config:init

## Development Guidelines

### Code Structure
```
military-planning-tool/
├── app/
│ ├── api/ # API routes
│ │ ├── auth/ # Authentication endpoints
│ │ ├── equipment/ # Equipment management
│ │ ├── systems/ # Systems integration
│ │ └── users/ # User management
│ ├── components/ # React components
│ │ ├── equipment/ # Equipment-related components
│ │ ├── systems/ # Systems-related components
│ │ └── ui/ # Shared UI components
│ ├── hooks/ # Custom React hooks
│ ├── lib/ # Utility functions and types
│ └── (routes)/ # Page components
├── prisma/ # Database schema and migrations
├── public/ # Static assets
└── types/ # TypeScript type definitions




## Security Considerations
- Role-based access control
- JWT token authentication
- Password hashing
- API route protection
- Data encryption
- Session management


### Environment Variables
Required environment variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
```

### API Routes
- `/api/auth/*` - Authentication endpoints
- `/api/equipment/*` - Equipment management
- `/api/systems/*` - Systems integration
- `/api/users/*` - User management

### Database Schema
The application uses Prisma with PostgreSQL. Key models include:
- Users
- Equipment
- Systems
- Consumables
- Maintenance Records
- Exercise Plans

## Support
For support, please create an issue in the GitHub repository or contact the development team.

## Acknowledgments
Built with:
- Next.js 14
- TypeScript
- Prisma
- PostgreSQL
- AWS S3
- Tailwind CSS
- Radix UI
- Recharts

