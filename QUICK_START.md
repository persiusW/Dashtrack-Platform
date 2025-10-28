# DashTrack Quick Start Guide

## 🚀 Getting Started

### Test User Credentials
A test user has been pre-created for you:

```
Email:    test@example.com
Password: password123
Role:     client_manager
```

### How to Login
1. Navigate to the app homepage (/)
2. Click "Sign In" 
3. Enter the credentials above
4. You'll be redirected to `/app/overview`

### What You Can Do
As a `client_manager`, you have access to:
- ✅ **Overview Dashboard** - View analytics and KPIs
- ✅ **Activations** - Create and manage campaigns
- ✅ **Zones** - Create zones within activations
- ✅ **Agents** - Manage field agents
- ✅ **Tracked Links** - Create trackable QR codes and links
- ✅ **Reports** - Export CSV reports

### Creating Your First Activation

1. Go to `/app/activations`
2. Click "Create Activation"
3. Fill in:
   - Name (e.g., "Spring Campaign 2025")
   - Description
   - Type (single or multi)
   - Start/End dates
   - Default landing URL (fallback for untracked links)
4. Click "Create"

### Creating Zones

1. Navigate to an activation detail page
2. Go to the "Zones" tab
3. Click "Create Zone"
4. Fill in:
   - Zone name (e.g., "Downtown Store")
   - Address (optional)
   - Lat/Lng coordinates (optional)
5. Click "Create"

### Creating Tracked Links

1. Go to activation detail → "Links" tab
2. Click "Create Link"
3. Configure:
   - Slug (unique identifier for URL)
   - Destination strategy:
     - **Single:** One URL for all devices
     - **Smart:** Different URLs for iOS/Android/fallback
   - Optional: Assign to zone or agent
4. Click "Create"
5. A QR code will be automatically generated!

### Public Agent Stats Page

Each agent has a unique public stats page at:
```
/a/{public_stats_token}
```

This page shows:
- Agent name and contact info
- Their unique QR code
- Last 7 days click statistics
- Time series chart

**No login required!** Perfect for sharing with external agents.

## 🔧 Technical Details

### Architecture
- **Frontend:** Next.js 15 (Page Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Multi-tenancy:** Row-level security based on `organization_id`
- **RBAC:** Roles: admin, client_manager, zone_supervisor, external_agent

### Database Schema
See `BACKEND_README.md` for complete schema documentation.

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=your_site_url
```

## 🐛 Troubleshooting

### "Database error querying schema" during login
See `docs/SUPABASE_AUTH_HOOK_SETUP.md` for detailed fix instructions.

**Quick fix:**
1. Go to Supabase Dashboard → Authentication → Hooks
2. Remove any "Custom Access Token" hooks
3. Try logging in again

### Preview not loading
1. Click the "Restart Server" button in Softgen settings (top right)
2. Or run: `pm2 restart all`

### RLS Policy Errors
The helper functions have been updated to handle missing JWT claims gracefully:
- `current_user_organization_id()` - Falls back to querying users table
- `is_admin()` - Falls back to querying users table

## 📚 Additional Documentation

- `BACKEND_README.md` - Complete backend architecture and API reference
- `docs/JWT_SETUP.md` - JWT claims configuration
- `docs/SUPABASE_AUTH_HOOK_SETUP.md` - Auth hooks troubleshooting

## 🎯 Next Steps

1. **Try logging in** with the test credentials
2. **Create your first activation** to see the workflow
3. **Generate a tracked link** and test the redirect at `/r/{slug}`
4. **View analytics** on the overview dashboard

Need help? The system is designed to be intuitive - explore the interface and the tooltips will guide you!
