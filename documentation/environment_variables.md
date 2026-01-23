# Environment Variables Configuration

This document lists all required environment variables for the Daily Companion platform.

## Supabase Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Application URLs

```bash
NEXT_PUBLIC_APP_URL=https://dailycompanion.app
NEXT_PUBLIC_PLATFORM_DOMAIN=dailycompanion.app
```

- `NEXT_PUBLIC_APP_URL`: The main platform URL
- `NEXT_PUBLIC_PLATFORM_DOMAIN`: The platform domain (without https://)

## Authentication

```bash
JWT_SECRET=your_jwt_secret_key_here
```

Generate a secure random string for JWT token signing.

## Stripe Configuration

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id
```

### Getting Stripe Keys:

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your API keys (use test keys for development)
3. For webhook secret: Set up a webhook endpoint at `/api/stripe/webhook`
4. For Connect Client ID: Go to https://dashboard.stripe.com/settings/applications

## Vercel Configuration (Custom Domains)

```bash
VERCEL_TOKEN=your_vercel_api_token
VERCEL_PROJECT_ID=prj_your_project_id
VERCEL_TEAM_ID=team_your_team_id
VERCEL_IP_ADDRESS=76.76.21.21
```

### Getting Vercel Credentials:

1. **VERCEL_TOKEN**: 
   - Go to https://vercel.com/account/tokens
   - Create a new token with `domains:read` and `domains:write` permissions
   
2. **VERCEL_PROJECT_ID**:
   - Go to your project settings in Vercel
   - Copy the Project ID from the General tab
   
3. **VERCEL_TEAM_ID** (optional):
   - Only required if using a team account
   - Found in team settings
   
4. **VERCEL_IP_ADDRESS**:
   - Default: `76.76.21.21`
   - Check Vercel docs for the current IP address to use for A records
   - See: https://vercel.com/docs/projects/domains/working-with-domains#step-2:-configure-your-domain

## Development Mode

```bash
DEV_BYPASS_STRIPE=false
NODE_ENV=development
```

- `DEV_BYPASS_STRIPE`: Set to `true` to bypass Stripe payment flow for testing (creates mock subscriptions)
- `NODE_ENV`: Set to `development`, `production`, or `test`

## Setup Instructions

1. Copy this template to a new `.env` file in the project root
2. Replace all placeholder values with your actual credentials
3. **Never commit `.env` to version control**
4. Use `.env.local` for local development overrides

## Production Checklist

Before deploying to production:

- [ ] Update all test keys to live keys (Stripe)
- [ ] Set `DEV_BYPASS_STRIPE=false`
- [ ] Set `NODE_ENV=production`
- [ ] Verify `NEXT_PUBLIC_APP_URL` matches your production domain
- [ ] Ensure webhook endpoints are configured in Stripe dashboard
- [ ] Test custom domain functionality with a real domain
- [ ] Verify SSL certificates are issuing correctly

## Security Notes

- Keep all secret keys secure and never expose them in client-side code
- Rotate tokens periodically
- Use different Stripe accounts for development and production
- Monitor Vercel API token usage
- Set appropriate CORS and rate limiting on API routes
