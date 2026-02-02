# Signup Page Usage Guide

## Overview

The signup page is a standalone page at `/signup` that coaches can link to directly for user registration.

## URL Structure

```
https://dailycompanion.app/signup?coach=COACH_SLUG&plan=PLAN_TYPE
```

### Query Parameters

1. **`coach`** (required) - Your coach slug (e.g., `testcoach`)
2. **`plan`** (optional) - Either `free` or `premium` (defaults to `free`)

## Examples

### Free Tier Signup
```
https://dailycompanion.app/signup?coach=testcoach&plan=free
```

### Premium Tier Signup ($19.99/month)
```
https://dailycompanion.app/signup?coach=testcoach&plan=premium
```

### Default (Free Tier)
```
https://dailycompanion.app/signup?coach=testcoach
```

## Features

### Branding
- Automatically displays your coach logo and branding colors
- Shows your business name and tagline
- Matches your landing page style

### Plans

#### Free Tier
- No credit card required
- User can upgrade later from their dashboard settings
- Limited features (no AI chat, no awareness tracking)

#### Premium Tier ($19.99/month)
- After signup, user is redirected to Stripe checkout
- Full access to all features
- Platform takes $7 flat fee, coach receives $12.99

## Use Cases

1. **Email Marketing**: Include direct signup links in newsletters
2. **Social Media**: Share signup links on Instagram, Twitter, etc.
3. **External Websites**: Link from your personal website or blog
4. **QR Codes**: Generate QR codes that link to your signup page

## Implementation

### On Your Landing Page
All CTAs on your coach landing page (`/coach/[yourslug]`) automatically redirect to the signup page:
- "Start Your Journey" button → Free signup
- "Start Free" button → Free signup
- "Start Premium" button → Premium signup

### Custom Links
You can create custom links for different contexts:

```html
<!-- Free tier for blog readers -->
<a href="https://dailycompanion.app/signup?coach=yourslug&plan=free">
  Start Free Trial
</a>

<!-- Premium tier for email campaigns -->
<a href="https://dailycompanion.app/signup?coach=yourslug&plan=premium">
  Join Premium Now
</a>
```

## Technical Details

- Clean, centered design with coach branding
- Mobile-responsive
- Form validation
- Automatic redirect to dashboard after free signup
- Automatic redirect to Stripe checkout for premium signup
- Error handling with user-friendly messages

## Support

For issues or questions, contact the platform administrator.
