# Kit (ConvertKit) Integration

## Overview
The Kit integration allows each coach to automatically sync their subscribers to their own Kit (ConvertKit) email list. When a user subscribes to their coaching program, they are automatically added as a subscriber in the coach's Kit account.

## Setup Instructions

### 1. Database Migration
Run the migration to add Kit fields to the coaches table:

```sql
-- Run this in Supabase SQL Editor
-- File: migrations/add_kit_integration.sql
```

This adds the following columns to the `coaches` table:
- `kit_api_key` - Encrypted Kit API key
- `kit_enabled` - Boolean flag to enable/disable sync
- `kit_form_id` - Optional form ID to subscribe users to
- `kit_tags` - JSON array of tags to apply
- `kit_last_sync` - Timestamp of last successful sync
- `kit_sync_status` - Status of last sync (pending/success/error)
- `kit_error_message` - Error message if sync failed

### 2. Environment Variable
Add to your `.env.local`:

```bash
# Kit API Key Encryption
KIT_ENCRYPTION_KEY="your-32-character-secret-key!!!"
```

**Important**: This key should be:
- Exactly 32 characters long
- Random and secure
- Never committed to git
- Different for production and development

### 3. Coach Configuration

Coaches can configure Kit integration in their dashboard:

1. Go to **Settings** tab
2. Find **Kit (ConvertKit) Integration** section
3. Enter Kit API Key (found in Kit under Settings → Advanced → API)
4. (Optional) Add Form ID to subscribe to specific form
5. (Optional) Add custom tags
6. Click **Test Connection** to verify
7. Enable the toggle
8. Click **Save Kit Settings**

## How It Works

### Automatic Sync
When a user subscribes to a coach's program:

1. Stripe webhook fires (`checkout.session.completed`)
2. User subscription is created in database
3. System checks if coach has Kit enabled
4. If enabled:
   - Retrieves coach's encrypted API key
   - Decrypts API key
   - Adds subscriber to Kit with:
     - Email
     - First name
     - Last name
     - Tags: `status:active`, `coach:{coach_name}`, + custom tags
   - Updates sync status in database

### Tags Applied
Every subscriber gets these tags automatically:
- `status:active` (or inactive, canceled, etc.)
- `coach:{coach_name}` - Name of their coach
- Any custom tags configured by the coach

### Manual Sync
Currently only automatic sync on subscription is supported. Future enhancement: manual sync button to sync existing users.

## API Endpoints

### Test Kit Connection
```javascript
POST /api/coach/kit/test
Body: {
  sessionToken: "...",
  apiKey: "kit_api_key"
}

Response: {
  success: true,
  account: {
    name: "Coach Name",
    primary_email: "coach@example.com"
  }
}
```

### Save Kit Settings
```javascript
POST /api/coach/kit/settings
Body: {
  sessionToken: "...",
  kitApiKey: "kit_api_key",
  kitEnabled: true,
  kitFormId: "1234567",
  kitTags: ["newsletter", "premium"]
}

Response: {
  success: true,
  message: "Kit settings saved successfully"
}
```

### Get Kit Settings
```javascript
GET /api/coach/kit/settings
Cookie: session_token=...

Response: {
  kitEnabled: true,
  kitFormId: "1234567",
  kitTags: ["newsletter", "premium"],
  kitHasApiKey: true,
  kitLastSync: "2024-01-15T10:30:00Z",
  kitSyncStatus: "success"
}
```

## Kit API Library

### Add Subscriber
```javascript
import { addSubscriberToKit } from '@/lib/kit';

await addSubscriberToKit({
  apiKey: 'your_kit_api_key',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  tags: ['new-subscriber', 'premium'],
  formId: '1234567' // optional
});
```

### Test Connection
```javascript
import { testKitConnection } from '@/lib/kit';

const result = await testKitConnection('your_kit_api_key');
// { success: true, account: { name: "...", primary_email: "..." } }
```

### Tag Subscriber
```javascript
import { tagSubscriber } from '@/lib/kit';

await tagSubscriber({
  apiKey: 'your_kit_api_key',
  email: 'user@example.com',
  tags: ['engaged', 'premium-tier']
});
```

## Security

### API Key Encryption
- API keys are encrypted before storage using AES-256-CBC
- Encryption key is stored in environment variable (never committed)
- Keys are only decrypted when needed for API calls
- Keys are never exposed in API responses

### Error Handling
- Kit sync errors don't break the main subscription flow
- Errors are logged and stored in `kit_error_message`
- Coaches can see sync status in their dashboard

## Troubleshooting

### Sync Status Shows "Error"
1. Check that API key is valid in Kit dashboard
2. Verify API key hasn't been revoked
3. Check error message in settings
4. Test connection button to verify

### Users Not Appearing in Kit
1. Verify Kit integration is **enabled**
2. Check sync status in settings
3. Look for error messages
4. Verify API key has correct permissions

### API Key Not Working
- Get fresh API key from Kit: Settings → Advanced → API
- Click "Test Connection" to verify
- Make sure key is from correct Kit account

## Future Enhancements

### Planned Features
- [ ] Manual sync button for existing users
- [ ] Bulk sync all users
- [ ] Sync on subscription cancellation (update tags)
- [ ] Webhook from Kit to sync back to platform
- [ ] Advanced tag rules and custom fields
- [ ] Sync history/logs in dashboard

## Support

### Kit Documentation
- [Kit API Docs](https://developers.convertkit.com/)
- [API Authentication](https://developers.convertkit.com/#authentication)
- [Subscribers API](https://developers.convertkit.com/#subscribers)

### Common Issues
- **403 Forbidden**: API key invalid or revoked
- **422 Unprocessable**: Email already exists (this is OK, subscriber will be updated)
- **Rate Limiting**: Kit has rate limits, handled automatically with retries
