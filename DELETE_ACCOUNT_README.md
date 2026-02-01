# Account Deletion Utility

**⚠️ DANGER: This permanently deletes accounts and ALL associated data!**

## What It Does

Immediately deletes user accounts and all related data - no confirmation required:

### For Coaches:
- Coach profile
- Custom domains
- User subscriptions to that coach
- All user data (below)

### For Regular Users:
- User subscriptions
- Focus entries (daily tasks, notes)
- Emotional state entries
- Mindfulness practice entries
- Chat messages (localStorage, not in DB)
- Active sessions

### For Both:
- Profile data
- Auth credentials

### For Orphaned Auth Users:
- Automatically detects and deletes auth users without profiles
- Perfect for cleaning up failed signup attempts

## Usage

### Command-Line Mode

```bash
# List all accounts
./delete-account.sh list

# Delete an account (no confirmation required)
./delete-account.sh delete user@example.com

# Delete orphaned auth user (automatically detected)
./delete-account.sh delete orphaned@example.com
```

## How It Works

1. **Looks up account by email**
2. **If profile exists** - Deletes all related data in proper order
3. **If only auth user exists** - Detects orphaned auth user and removes it
4. **If neither exists** - Reports account not found

## Example Output

### Deleting a Full Account

```bash
$ ./delete-account.sh delete test@example.com

🔍 Looking up account: test@example.com...

Found account:
  Email: test@example.com
  Name: Test User
  Role: coach
  Coach: Test Coaching
  User ID: abc123...

🗑️  Deleting account and all data...

→ Deleting custom domains...
→ Deleting user subscriptions to this coach...
→ Deleting coach profile...
→ Deleting user subscriptions...
→ Deleting focus entries...
→ Deleting emotional state entries...
→ Deleting mindfulness entries...
→ Deleting sessions...
→ Deleting profile...
→ Deleting auth user...

✅ Account deleted successfully
   Email: test@example.com
   Coach: Test Coaching
   All associated data has been removed.
```

### Deleting an Orphaned Auth User

```bash
$ ./delete-account.sh delete orphaned@example.com

🔍 Looking up account: orphaned@example.com...

No profile found. Checking for orphaned auth user...

Found orphaned auth user:
  Email: orphaned@example.com
  ID: 54eaa704-5fd0-452d-a48f-c81f4ec602df
  Created: 2026-01-30T00:04:02.391006Z

🗑️  Deleting orphaned auth user...

✅ Orphaned auth user deleted
   Email: orphaned@example.com
```

## Deletion Order

The script deletes data in this order to respect foreign key constraints:

1. **Custom domains** (if coach)
2. **User subscriptions to coach** (if coach)
3. **Coach profile** (if coach)
4. **User's own subscriptions**
5. **Focus entries**
6. **Emotional state entries**
7. **Mindfulness entries**
8. **Sessions**
9. **Profile** (cascades to auth.users)

## When to Use

- **Development cleanup** - Remove test accounts quickly
- **GDPR/data deletion requests** - Permanently delete user data
- **Failed signups** - Clean up orphaned auth users
- **Account removal** - Delete problematic or unwanted accounts

## When NOT to Use

- **Temporary deactivation** - Use `manage-coach.sh` or `manage-user.sh` instead
- **Subscription removal only** - Use `manage-user.sh demote`
- **Production without caution** - Always double-check the email first

## Requirements

- `jq` (JSON processor)
  ```bash
  brew install jq  # macOS
  ```
- `.env` file with Supabase credentials
- Service role key (not anon key)

## Important Notes

- **⚠️ NO CONFIRMATION** - Deletion happens immediately
- **Permanent** - Cannot be undone
- **Handles orphaned auth users** - Automatically detects and removes
- **Cascade delete** - All related data is removed
- **Stripe subscriptions** - Cancel in Stripe separately if needed

## Related Scripts

- `./manage-coach.sh` - Manage coach subscriptions (non-destructive)
- `./manage-user.sh` - Manage user subscriptions (non-destructive)
- `./delete-account.sh` - Delete accounts (destructive, no confirmation)

## Best Practices

1. **Verify email first** - Use `./delete-account.sh list` to check
2. **Double-check** - Make sure you have the correct email
3. **Test in dev** - Practice with test accounts first
4. **Backup if needed** - Export data before deletion in production
5. **Check Stripe** - Manually cancel subscriptions if needed

---

**⚠️ NO UNDO - DELETION IS IMMEDIATE AND PERMANENT!**
