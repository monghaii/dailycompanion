# Coach Management Script

Quick bash script to manage coach subscription status in development.

## Usage

### Interactive Mode (Recommended)

Just run the script with no arguments:

```bash
./manage-coach.sh
```

You'll see a menu:
```
╔════════════════════════════════════════════════════╗
║     Coach Subscription Manager (Dev Tool)         ║
╚════════════════════════════════════════════════════╝

What would you like to do?

  1) List all coaches
  2) Activate a coach (promote)
  3) Deactivate a coach (demote)
  4) Check coach status
  5) Exit
```

### Command-Line Mode

```bash
# List all coaches
./manage-coach.sh list

# Activate a coach by slug
./manage-coach.sh activate twinleaf

# Deactivate a coach by slug
./manage-coach.sh deactivate twinleaf

# Check coach status
./manage-coach.sh status twinleaf
```

## Aliases

- `list` = `ls`
- `activate` = `promote`
- `deactivate` = `demote`
- `status` = `show` = `info`

## Examples

```bash
# Interactive mode - easiest!
./manage-coach.sh

# Quick commands
./manage-coach.sh list
./manage-coach.sh activate twinleaf
./manage-coach.sh status twinleaf
./manage-coach.sh deactivate twinleaf
```

## What It Does

**Activate**: Sets coach to active subscription without Stripe
- `platform_subscription_status` = 'active'
- `is_active` = true
- `setup_fee_paid` = true
- Marks setup fee as paid with timestamp

**Deactivate**: Removes active subscription
- `platform_subscription_status` = 'inactive'
- `is_active` = false

## Requirements

- `jq` (for JSON parsing)
  ```bash
  brew install jq  # macOS
  ```
- `.env` file with Supabase credentials

## Notes

⚠️ **Development only** - This bypasses Stripe payments
