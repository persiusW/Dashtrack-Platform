
# DashTrack

A powerful multi-tenant SaaS platform for tracking agent activations and analyzing engagement metrics across multiple zones. Built with Next.js, TypeScript, and Supabase.

## 🚀 Features

- **Multi-Tenant Architecture**: Complete organization-level isolation with Row-Level Security (RLS)
- **Role-Based Access Control**: Admin, Client Manager, Zone Supervisor, and External Agent roles
- **Real-Time Analytics**: Track clicks, conversions, and engagement metrics in real-time
- **Smart Link Routing**: Device-aware link redirection (iOS, Android, fallback)
- **Zone Management**: Organize activations by geographic zones with agents
- **Public Agent Stats**: Shareable statistics pages for external agents
- **QR Code Generation**: Automated QR code creation with signed URL access
- **Data Retention**: Automated cleanup of old click data with configurable retention periods

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 (Page Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Database**: PostgreSQL with comprehensive RLS policies
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git for version control

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd dashtrack
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_BYPASS_ORG_IDS=optional-admin-org-uuids
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Database Schema

Run the migration files in order:

1. Open Supabase Dashboard → SQL Editor
2. Execute each migration file in `supabase/migrations/` in chronological order
3. Migrations include:
   - Table creation with foreign keys
   - Indexes for performance
   - RLS policies for security
   - Storage bucket configuration
   - Seed data (optional)

### 4. Configure JWT Custom Claims

Follow the detailed guide in `docs/JWT_SETUP.md`:

1. Create the `custom_access_token_hook` function
2. Grant permissions to `supabase_auth_admin`
3. Configure the hook in Supabase Dashboard → Authentication → Hooks
4. Test with a user login to verify claims

### 5. Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `qr` (private)
3. RLS policies are automatically applied from migrations

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
dashtrack/
├── docs/
│   └── JWT_SETUP.md              # JWT custom claims setup guide
├── public/
│   └── favicon.ico               # App favicon
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginForm.tsx     # Authentication form
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx     # Main app layout with sidebar
│   │   ├── ui/                   # shadcn/ui components
│   │   └── ThemeSwitch.tsx       # Dark/light theme toggle
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Auth state management
│   │   └── ThemeProvider.tsx     # Theme state management
│   ├── hooks/
│   │   ├── use-mobile.tsx        # Mobile detection hook
│   │   ├── use-toast.ts          # Toast notifications hook
│   │   └── useSubscriptionGate.ts # Subscription feature gating
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts         # Supabase client instance
│   │       ├── types.ts          # Database TypeScript types
│   │       └── database.types.ts # Auto-generated DB types
│   ├── lib/
│   │   └── utils.ts              # Utility functions
│   ├── pages/
│   │   ├── api/                  # Next.js API routes
│   │   ├── app/                  # Protected application pages
│   │   │   ├── overview.tsx      # Dashboard with analytics
│   │   │   ├── activations/      # Activation management
│   │   │   ├── zones/            # Zone management
│   │   │   ├── agents/           # Agent management
│   │   │   ├── links/            # Link tracking
│   │   │   ├── admin/            # Admin-only pages
│   │   │   └── settings.tsx      # User settings
│   │   ├── a/
│   │   │   └── [public_stats_token].tsx # Public agent stats page
│   │   ├── index.tsx             # Login/landing page
│   │   ├── 404.tsx               # Custom 404 page
│   │   ├── _app.tsx              # Next.js app wrapper
│   │   └── _document.tsx         # Next.js document wrapper
│   ├── services/
│   │   ├── authService.ts        # Authentication operations
│   │   ├── agentService.ts       # Agent CRUD operations
│   │   ├── activationService.ts  # Activation CRUD operations
│   │   ├── clickService.ts       # Click tracking operations
│   │   ├── trackedLinkService.ts # Link management operations
│   │   └── zoneService.ts        # Zone CRUD operations
│   ├── styles/
│   │   └── globals.css           # Global styles and Tailwind
│   └── middleware.ts             # Route protection middleware
├── supabase/
│   └── migrations/               # Database migration files
├── BACKEND_README.md             # Comprehensive backend documentation
├── README.md                     # This file
├── package.json                  # Dependencies and scripts
├── tailwind.config.ts            # Tailwind configuration
└── tsconfig.json                 # TypeScript configuration
```

## 🔐 Authentication & Authorization

### User Roles

1. **Admin**: Full access to all organizations and features
2. **Client Manager**: Manage activations, zones, agents, and links within their organization
3. **Zone Supervisor**: View and manage specific zones within their organization
4. **External Agent**: No login access; view stats via public token

### Route Protection

Routes are protected via middleware (`src/middleware.ts`):

- `/app/*` - Requires authentication
- `/app/admin/*` - Requires admin role
- `/app/*` - Requires organization membership

### JWT Custom Claims

Custom claims are injected into JWT tokens:
- `organization_id`: User's organization UUID
- `role`: User's role (admin, client_manager, zone_supervisor)

These claims power the Row-Level Security policies. See `docs/JWT_SETUP.md` for setup.

## 🗄️ Database Schema

### Core Tables

- **organizations**: Top-level tenant entities
- **users**: User accounts with organization and role
- **activations**: Marketing campaigns/activations
- **zones**: Geographic or logical groupings within activations
- **agents**: External agents assigned to zones
- **zone_agents**: Many-to-many relationship between zones and agents
- **tracked_links**: Smart links with device-specific routing
- **clicks**: Click tracking data with device info
- **daily_metrics**: Aggregated daily statistics

See `BACKEND_README.md` for complete schema documentation.

## 🔒 Security Features

### Row-Level Security (RLS)

Every table has RLS enabled with policies that:
- Enforce organization-level data isolation
- Allow admin users to bypass restrictions
- Permit anonymous click inserts for tracking
- Validate all operations against JWT claims

### Storage Security

- QR codes stored in private bucket
- Signed URLs for temporary access
- Organization-scoped access policies

### Input Validation

- SQL injection prevention via parameterized queries
- Type-safe operations with TypeScript
- Server-side validation for all mutations

## 📊 Analytics & Reporting

### Overview Dashboard

- Total clicks across all activations
- Time series charts (last 7/30/90 days)
- Top performing zones and agents
- Real-time data updates

### Activation Reports

- Activation-specific metrics
- Zone performance comparison
- Agent contribution tracking
- Export capabilities (placeholder)

### Public Agent Stats

Agents receive a unique URL: `/a/[public_stats_token]`

Features:
- No login required
- Personal statistics only
- QR code download link
- Last 7 days performance

## 🎨 UI/UX Features

- **Dark/Light Theme**: Automatic theme switching with system preference detection
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessible Components**: WCAG AA compliant shadcn/ui components
- **Loading States**: Skeleton screens and loading indicators
- **Error Handling**: User-friendly error messages and fallbacks

## 🔧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

### Environment Variables

Required variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Configuration
ADMIN_BYPASS_ORG_IDS=uuid1,uuid2

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting (optional)
- Named exports for components and utilities
- Default exports for Next.js pages only

## 🚀 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Supabase)

Already deployed when you create your Supabase project. Additional steps:

1. Configure production environment variables
2. Set up custom domain (optional)
3. Enable Edge Functions if needed
4. Configure SMTP for email (optional)

### Post-Deployment

1. Run database migrations in production
2. Configure JWT hooks in production dashboard
3. Create initial admin user and organization
4. Test authentication flow
5. Verify RLS policies are working

## 📈 Performance Optimization

- **Database Indexes**: Comprehensive indexing for query performance
- **Server Components**: Minimal client-side JavaScript
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js automatic image optimization
- **Edge Functions**: Serverless functions for click tracking

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration and login
- [ ] JWT claims include organization_id and role
- [ ] RLS policies enforce organization isolation
- [ ] Admin users can access all organizations
- [ ] Non-admin users restricted to their organization
- [ ] Public agent stats page works without auth
- [ ] QR code generation and signed URLs
- [ ] Click tracking and analytics
- [ ] Theme switching works correctly
- [ ] Mobile responsiveness

### Automated Testing (Future)

Placeholder for:
- Unit tests with Jest
- Integration tests with React Testing Library
- E2E tests with Playwright
- API endpoint tests

## 🐛 Troubleshooting

### Common Issues

**JWT claims not appearing**
- Verify auth hook is configured in Supabase Dashboard
- Check function permissions with `GRANT EXECUTE`
- Log out and log back in to refresh token

**RLS policies blocking access**
- Verify user has organization_id in users table
- Check JWT claims with `session.user`
- Ensure policies reference correct claim structure

**Preview not loading**
- Click "Restart Server" in Softgen settings
- Check for runtime errors in browser console
- Verify all environment variables are set

See `docs/JWT_SETUP.md` for detailed troubleshooting.

## 📚 Documentation

- [Backend Architecture](./BACKEND_README.md) - Complete database schema and API documentation
- [JWT Setup Guide](./docs/JWT_SETUP.md) - Step-by-step JWT custom claims configuration
- [Supabase Docs](https://supabase.com/docs) - Official Supabase documentation
- [Next.js Docs](https://nextjs.org/docs) - Official Next.js documentation

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- [Vercel](https://vercel.com) for hosting and deployment
- [Next.js](https://nextjs.org) for the React framework

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact the development team
- Check the documentation files

---

**Built with ❤️ using Next.js and Supabase**

© 2025 DashTrack. All rights reserved.
