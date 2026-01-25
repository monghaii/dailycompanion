# Coach Subscription Manager

Development tool to manage coach subscription status without going through Stripe.

## Installation

```bash
npm install
```

## Usage

### List all coaches

```bash
npm run coach:list
```

or

```bash
node scripts/manage-coach-subscription.js list
```

### Activate a coach (bypass Stripe payment)

```bash
node scripts/manage-coach-subscription.js <slug> activate
```

Example:
```bash
node scripts/manage-coach-subscription.js twinleaf activate
```

This will:
- Set `platform_subscription_status` to `'active'`
- Set `is_active` to `true`
- Mark `setup_fee_paid` as `true`
- Set `setup_fee_paid_at` to current timestamp

### Deactivate a coach

```bash
node scripts/manage-coach-subscription.js <slug> deactivate
```

Example:
```bash
node scripts/manage-coach-subscription.js twinleaf deactivate
```

This will:
- Set `platform_subscription_status` to `'inactive'`
- Set `is_active` to `false`

### Check coach status

```bash
node scripts/manage-coach-subscription.js <slug> status
```

Example:
```bash
node scripts/manage-coach-subscription.js twinleaf status
```

Shows:
- Business name, slug, email
- Subscription status
- Setup fee status
- Stripe customer & subscription IDs
- Stripe Connect status

## Aliases

You can use shorter action names:
- `promote` = `activate`
- `demote` = `deactivate`  
- `show` / `info` = `status`

## Examples

```bash
# List all coaches
node scripts/manage-coach-subscription.js list

# Activate a coach for testing
node scripts/manage-coach-subscription.js twinleaf activate

# Check their status
node scripts/manage-coach-subscription.js twinleaf status

# Deactivate when done testing
node scripts/manage-coach-subscription.js twinleaf deactivate
```

## Notes

⚠️ **Development Only**: This tool bypasses Stripe payments. Only use in development/testing.

- Changes take effect immediately
- Coach will see changes after refreshing their dashboard
- No Stripe customer or subscription is created
- Use this to test the subscription-locked features without paying
