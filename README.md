# Military Planning Tool

A Next.js application for military exercise planning, cost analysis, and resource management. Built with TypeScript and designed for managing complex military operations with cost tracking and resource allocation.

## Architecture Overview

### Framework & Technology Stack

**Frontend Framework:**
- **Next.js 13.5.11** with App Router - Modern React framework with server-side rendering and file-based routing
- **TypeScript** - Static type checking for enhanced development experience and code reliability
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Radix UI** - Accessible, unstyled UI primitives for building design systems

**Backend Architecture:**
- **Next.js API Routes** - Server-side API endpoints with automatic optimization
- **Prisma ORM** - Type-safe database client with automatic migrations
- **PostgreSQL 15+** - Relational database with advanced querying capabilities
- **Redis 7+** - In-memory data store for caching and session management

**Authentication & Security:**
- **JWT (JSON Web Tokens)** - Stateless authentication with secure token management
- **Multi-Factor Authentication (MFA)** - TOTP-based two-factor authentication using otplib
- **bcryptjs** - Password hashing with salt rounds for secure storage
- **Role-based Access Control** - Granular permissions system for different user types

**Development & Testing:**
- **Jest** - JavaScript testing framework with React Testing Library integration
- **Docker & Docker Compose** - Containerization for development and deployment
- **ESLint & Prettier** - Code quality and formatting tools
- **TypeScript strict mode** - Enhanced type safety and error prevention

## Backend Architecture

### Database Design
The application uses PostgreSQL with Prisma ORM for type-safe database operations:

**Core Models:**
- **User** - Authentication, roles, and MFA settings
- **Exercise** - Military exercise definitions and configurations
- **System** - Equipment and system specifications
- **Equipment** - Individual equipment items and consumables
- **Settings** - Application-wide configuration
- **AuditLog** - Comprehensive activity tracking

**Key Features:**
- Foreign key relationships with cascade operations
- JSON fields for flexible metadata storage
- Automatic timestamps (createdAt, updatedAt)
- Database indexes for optimized query performance
- Connection pooling for concurrent request handling

### API Structure
The API follows RESTful conventions with Next.js App Router:

```
app/api/
├── auth/                    # Authentication endpoints
│   ├── login/route.ts       # User authentication
│   ├── logout/route.ts      # Session termination
│   ├── session/route.ts     # Session validation
│   └── mfa/                 # Multi-factor authentication
│       ├── setup/route.ts   # MFA configuration
│       ├── verify/route.ts  # Token verification
│       └── disable/route.ts # MFA removal
├── exercises/               # Exercise management
│   ├── route.ts            # CRUD operations
│   └── [id]/route.ts       # Individual exercise operations
├── systems/                 # System management
├── equipment/               # Equipment management
├── analytics/               # Data analytics and reporting
├── export/                  # Data export functionality
└── database/                # Database utilities and health checks
```

### Security Implementation
- **Input Validation** - Zod schemas for request validation
- **Rate Limiting** - API endpoint protection against abuse
- **CORS Configuration** - Cross-origin request handling
- **SQL Injection Prevention** - Parameterized queries via Prisma
- **XSS Protection** - Input sanitization and content security policies

## Comprehensive Setup Guide

### System Requirements

**Minimum Requirements:**
- Node.js 18.0 or higher
- npm 8.0 or higher
- 4GB RAM
- 2GB available disk space

**Recommended Requirements:**
- Node.js 20.0 or higher
- npm 10.0 or higher
- 8GB RAM
- 10GB available disk space
- Docker Desktop (for containerized development)

### Development Environment Setup

#### 1. Project Initialization

```bash
# Clone the repository
git clone <repository-url>
cd planning-tool

# Verify Node.js version
node --version  # Should be 18.0+

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

#### 2. Database Setup

**Option A: Using Docker (Recommended)**
```bash
# Start PostgreSQL and Redis containers
docker-compose up -d postgres redis

# Verify containers are running
docker-compose ps

# Check container logs
docker-compose logs postgres
docker-compose logs redis
```

**Option B: Local Installation**
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server
```

#### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit configuration file
nano .env.local
```

**Required Environment Variables:**
```env
# Database Configuration
DATABASE_URL="postgresql://planning_user:planning_pass@localhost:5432/planning_tool"

# Authentication Secrets
JWT_SECRET="your-secure-jwt-secret-minimum-32-characters"
NEXTAUTH_SECRET="your-nextauth-secret-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# Application Settings
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Optional Configuration:**
```env
# Redis Caching
REDIS_URL="redis://localhost:6379"

# Email Notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Military Planning Tool <noreply@yourorganization.mil>"

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING="true"
LOG_LEVEL="info"

# Security Settings
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"
```

#### 4. Database Initialization

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name initial

# Seed database with initial data (optional)
npx prisma db seed

# Verify database connection
npx prisma studio  # Opens database browser at http://localhost:5555
```

#### 5. Application Startup

```bash
# Start development server
npm run dev

# The application will be available at:
# - Frontend: http://localhost:3000
# - Database Studio: http://localhost:5555 (if running)
```

#### 6. Initial User Setup

The application includes a default admin user:
- **Email:** admin@test.com
- **Password:** admin123
- **Role:** ADMIN

Access the application and log in to verify the setup is complete.

### Production Deployment Setup

#### 1. Build Optimization

```bash
# Install production dependencies only
npm ci --only=production

# Build the application
npm run build

# Test production build locally
npm start
```

#### 2. Docker Production Deployment

```bash
# Build production containers
docker-compose --profile production build

# Start production environment
docker-compose --profile production up -d

# Verify deployment
docker-compose --profile production ps
```

#### 3. Environment Variables for Production

```env
# Production Database
DATABASE_URL="postgresql://prod_user:secure_password@db.example.com:5432/planning_tool"

# Security Settings
JWT_SECRET="extremely-secure-production-jwt-secret-64-characters-minimum"
NEXTAUTH_SECRET="production-nextauth-secret-64-characters-minimum"
NEXTAUTH_URL="https://planning.yourorganization.mil"

# Production Settings
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://planning.yourorganization.mil"

# SSL/TLS Configuration
FORCE_HTTPS="true"
SECURE_COOKIES="true"
```

### Verification Steps

After setup completion, verify the installation:

```bash
# 1. Check application health
curl http://localhost:3000/api/system/health-check

# 2. Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# 3. Run test suite
npm test

# 4. Check database connectivity
npx prisma db push
```

## How to Use

### Getting Started

#### First Login
1. **Access the Application**
   - Navigate to http://localhost:3000
   - You'll be redirected to the login page

2. **Login with Default Credentials**
   - Email: `admin@test.com`
   - Password: `admin123`
   - Click "Sign In"

3. **Initial Setup**
   - Upon first login, you'll be directed to the main dashboard
   - Consider setting up Multi-Factor Authentication (MFA) for enhanced security
   - Review and update your profile information

### Core Workflows

#### Exercise Planning

**Creating a New Exercise:**
1. Navigate to "Exercises" from the main menu
2. Click "New Exercise" button
3. Fill in exercise details:
   - **Name**: Descriptive exercise name
   - **Description**: Purpose and objectives
   - **Start/End Dates**: Exercise timeline
   - **Location**: Geographic area or facility
   - **Scenario**: Operational context
4. Add systems and equipment requirements
5. Set budget parameters and constraints
6. Save the exercise

**Managing Exercise Systems:**
1. Open an existing exercise
2. Navigate to "Systems" tab
3. Click "Add System" to include equipment
4. Configure system parameters:
   - Quantity required
   - Duration of use
   - Specific configurations
   - Lead time requirements
5. Set consumables and maintenance schedules

**Cost Analysis:**
1. In the exercise view, access "Cost Analysis" tab
2. Review automated cost calculations:
   - Equipment rental/purchase costs
   - Consumables expenses
   - Transportation costs
   - Personnel costs (if configured)
3. Adjust parameters to see real-time cost updates
4. Set budget alerts and thresholds
5. Generate cost reports

#### Equipment Management

**Adding New Equipment:**
1. Go to "Equipment" section
2. Click "Add Equipment"
3. Enter equipment specifications:
   - **Basic Information**: Name, model, manufacturer
   - **Technical Specifications**: Performance parameters
   - **Cost Information**: Purchase/rental rates
   - **Logistics**: Weight, dimensions, transport requirements
   - **Consumables**: Associated supply requirements
4. Upload documentation and images
5. Save equipment profile

**Managing Equipment Inventory:**
1. View equipment list with filters and search
2. Track availability and utilization
3. Update equipment status:
   - Available
   - In Use
   - Maintenance Required
   - Decommissioned
4. Schedule maintenance and inspections
5. Monitor consumables levels

#### System Management

**Creating System Profiles:**
1. Navigate to "Systems" menu
2. Click "New System"
3. Define system characteristics:
   - **System Type**: Communication, surveillance, etc.
   - **Components**: Individual equipment items
   - **Capabilities**: Operational parameters
   - **Requirements**: Power, space, personnel
4. Set cost models and pricing
5. Configure lead times and availability

**System Integration:**
1. Link related equipment and subsystems
2. Define system dependencies
3. Set up consumables requirements
4. Configure maintenance schedules
5. Establish operational parameters

### User Management

#### Managing User Accounts (Admin Only)

**Adding New Users:**
1. Access "Settings" → "User Management"
2. Click "Add User"
3. Enter user information:
   - Name and email address
   - Role assignment (Admin, Planner, Viewer)
   - Initial password
   - Account status
4. Configure permissions
5. Send invitation email

**Role Management:**
- **Admin**: Full system access, user management
- **Planner**: Create/edit exercises, manage equipment
- **Viewer**: Read-only access to data and reports

#### Setting Up Multi-Factor Authentication

**For Individual Users:**
1. Click on your profile (top right)
2. Select "Security Settings"
3. Click "Enable MFA"
4. Scan QR code with authenticator app (Google Authenticator, Authy)
5. Enter verification code
6. Save backup codes securely
7. Complete MFA setup

### Advanced Features

#### Analytics and Reporting

**Accessing Analytics:**
1. Navigate to "Analytics" dashboard
2. Select report type:
   - Cost trends over time
   - Equipment utilization rates
   - Exercise frequency analysis
   - Budget variance reports

**Generating Custom Reports:**
1. Use the report builder interface
2. Select data sources and metrics
3. Apply filters and date ranges
4. Choose visualization types
5. Export or share reports

#### Data Export

**Excel Export:**
1. From any data view, click "Export"
2. Select "Excel Format"
3. Choose data range and filters
4. Download generated file

**PowerPoint Export:**
1. In Analytics section, select desired charts
2. Click "Export to PowerPoint"
3. Customize presentation template
4. Download presentation file

#### Search and Filtering

**Using Global Search:**
1. Use the search bar at the top of any page
2. Enter keywords for equipment, exercises, or systems
3. Use filters to narrow results:
   - Date ranges
   - Categories
   - Status
   - Cost ranges

**Advanced Filtering:**
1. Click filter icon in data tables
2. Apply multiple criteria simultaneously
3. Save frequently used filter combinations
4. Export filtered data

### Workflow Examples

#### Planning a Training Exercise

1. **Create Exercise Framework**
   - Define exercise objectives and scope
   - Set timeline and location parameters
   - Establish budget constraints

2. **Add Required Systems**
   - Browse system catalog
   - Select appropriate systems for scenarios
   - Configure quantities and durations

3. **Review Resource Requirements**
   - Check equipment availability
   - Verify lead times for procurement
   - Assess consumables needs

4. **Analyze Costs**
   - Review automated cost calculations
   - Adjust parameters if over budget
   - Get approval for budget allocation

5. **Generate Documentation**
   - Export equipment lists
   - Create cost summaries
   - Generate planning reports

#### Monthly Cost Analysis

1. **Access Analytics Dashboard**
   - Navigate to Analytics section
   - Select "Monthly Cost Trends"

2. **Apply Filters**
   - Set date range for analysis period
   - Filter by exercise type or unit
   - Group by cost categories

3. **Generate Insights**
   - Identify cost trends and patterns
   - Compare against budget targets
   - Find optimization opportunities

4. **Create Reports**
   - Export findings to Excel
   - Generate presentation materials
   - Share with stakeholders

### Tips for Effective Use

**Performance Optimization:**
- Use filters to limit large data sets
- Regular browser cache clearing
- Close unused browser tabs
- Use keyboard shortcuts for navigation

**Data Management:**
- Regular backup of critical data
- Maintain updated equipment information
- Archive completed exercises
- Regular database maintenance

**Security Best Practices:**
- Enable MFA for all accounts
- Use strong, unique passwords
- Regular password updates
- Log out when session complete
- Monitor user activity logs

### Troubleshooting Common Issues

**Login Problems:**
- Verify credentials are correct
- Check if MFA is enabled and use correct token
- Clear browser cache and cookies
- Contact administrator for password reset

**Performance Issues:**
- Check internet connection
- Close other applications using bandwidth
- Refresh the page
- Contact support if problems persist

**Data Not Loading:**
- Check database connection status
- Verify user permissions for the data
- Try refreshing the page
- Check system status dashboard

**Export Failures:**
- Ensure sufficient data is selected
- Check file size limitations
- Verify export permissions
- Try different export format

## Features

### Core Functionality
- Exercise planning and management with system requirements tracking
- Cost analysis and budget management with real-time calculations
- Equipment and system database with specifications
- Resource allocation with consumables tracking
- User and permission management with role-based access control

### Security & Authentication
- JWT-based authentication
- Multi-Factor Authentication (MFA) with TOTP support
- Role-based access control
- Audit logging for all system activities
- Rate limiting and input validation

### Data & Analytics
- Real-time notifications via WebSocket
- Search functionality with filtering
- Export capabilities (Excel, PowerPoint, CSV, PDF)
- Analytics dashboard with cost projections
- Performance monitoring and metrics

### Infrastructure
- Redis caching with intelligent invalidation
- Database optimization with query monitoring
- Webhook integration for external systems
- Docker containerization
- Health checks and monitoring

## Project Structure

```
planning-tool/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/             # Authentication
│   │   ├── analytics/        # Analytics
│   │   ├── exercises/        # Exercise management
│   │   ├── systems/          # System management
│   │   ├── equipment/        # Equipment management
│   │   └── export/           # Export functionality
│   ├── components/           # React Components
│   │   ├── ui/               # Base UI components
│   │   ├── analytics/        # Analytics components
│   │   ├── equipment/        # Equipment components
│   │   ├── exercises/        # Exercise components
│   │   └── settings/         # Settings components
│   ├── lib/                  # Utilities and libraries
│   └── __tests__/            # Test files
├── prisma/                   # Database schema
└── docker-compose.yml       # Docker configuration
```

## API Endpoints

### Authentication
```
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout
GET  /api/auth/session        # Current session
POST /api/auth/mfa/setup      # Setup MFA
POST /api/auth/mfa/verify     # Verify MFA token
```

### Exercise Management
```
GET    /api/exercises         # List exercises
POST   /api/exercises         # Create exercise
GET    /api/exercises/[id]    # Get exercise
PUT    /api/exercises/[id]    # Update exercise
DELETE /api/exercises/[id]    # Delete exercise
```

### System Management
```
GET    /api/systems          # List systems
POST   /api/systems          # Create system
GET    /api/systems/[id]     # Get system
PUT    /api/systems/[id]     # Update system
DELETE /api/systems/[id]     # Delete system
```

### Analytics
```
GET /api/analytics           # Analytics data
GET /api/export/excel        # Export to Excel
GET /api/export/powerpoint   # Export to PowerPoint
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
```

## Database Operations

```bash
# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Open database studio
npx prisma studio
```

## Production Deployment

```bash
# Build application
npm run build

# Start production server
npm start

# Or use Docker
docker-compose --profile production up -d
```

## Development Commands

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

## Troubleshooting

### Database Issues
```bash
# Check database status
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Cache Issues
```bash
# Check Redis status
docker-compose ps redis

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```


