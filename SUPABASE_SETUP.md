# Supabase Configuration Guide

## Required Configuration

### Enable Anonymous Authentication

To fully optimize the security model, enable anonymous authentication in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication → Providers**
3. Find **Anonymous Sign-ins** in the provider list
4. Toggle it to **Enabled**
5. Click **Save**

**Note:** The app currently uses a fallback authentication method that creates temporary email accounts if anonymous auth is disabled. Enabling anonymous auth provides better performance and cleaner authentication flow.

### Configure Auth DB Connection Strategy

The Auth server connection pool should use percentage-based allocation for better scalability:

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings → Database → Connection Pooling**
3. Find the **Auth Pool** configuration
4. Change from **"Fixed (10 connections)"** to **"Percentage-based"**
5. This allows the Auth server to scale connections automatically with your instance size

## Security Improvements

The following security measures have been implemented:

### Row Level Security (RLS)

All tables use strict RLS policies:

- **app_settings**: Users can only access their own settings
- **tampering_events**: Users can only view their own tampering events

All policies verify that `auth.uid() = user_id` before allowing access.

### Authentication

- Server-side authentication using Supabase Auth
- Each user receives a unique UUID from the auth system
- Complete data isolation between users
- No client-side ID generation
