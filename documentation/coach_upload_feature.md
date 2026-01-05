# Coach Upload Feature - Setup Instructions

## Overview
The coach upload functionality has been implemented, allowing coaches to upload logos and other media files. Files are stored in Supabase Storage with proper security policies.

## What Was Implemented

### 1. Storage Bucket Configuration (`documentation/storage_setup.sql`)
- SQL script to create storage policies for the `coach-uploads` bucket
- Security policies that ensure coaches can only upload/delete their own files
- Public read access for displaying logos on coach landing pages

### 2. Upload API Route (`src/app/api/upload/route.js`)
- `POST /api/upload` - Upload files with validation
  - File type validation (images, audio, video)
  - File size limit (5MB)
  - Automatic file organization by user ID and type
- `DELETE /api/upload` - Delete uploaded files
  - Security check to ensure coaches only delete their own files

### 3. Coach Profile API Updates (`src/app/api/coach/profile/route.js`)
- Added `logo_url` parameter support
- Profile updates can now include logo URL

### 4. Dashboard UI Updates (`src/app/dashboard/page.js`)
- Logo upload component in Profile section
- Image preview with remove button
- Upload progress indication
- File validation and user feedback
- State management for `logo_url` in profile config

## Setup Steps

### 1. Create Storage Bucket in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `coach-uploads`
   - **Public bucket**: NO (leave unchecked)
   - **File size limit**: 5MB (recommended)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`
     - `audio/mpeg`
     - `audio/wav`
     - `video/mp4`
5. Click **"Create bucket"**

### 2. Run Storage Policies SQL

1. Go to **SQL Editor** in Supabase Dashboard
2. Open `documentation/storage_setup.sql`
3. Copy and paste the entire SQL script
4. Click **"Run"**

This will create the necessary security policies for the bucket.

### 3. Test the Upload Feature

1. Log in as a coach
2. Go to the Dashboard
3. Navigate to the "Profile" section
4. Click "Choose Image" under Business Logo
5. Select an image file (JPEG, PNG, GIF, or WebP)
6. Wait for upload to complete
7. Click "Save" to update your profile
8. Verify the logo appears on your coach landing page

## File Organization

Files are organized in the storage bucket as follows:

```
coach-uploads/
└── {user_id}/
    ├── logo/
    │   └── {timestamp}-{filename}
    ├── audio/
    │   └── {timestamp}-{filename}
    └── video/
        └── {timestamp}-{filename}
```

## Security Features

- ✅ Coaches can only upload files to their own folders
- ✅ Coaches can only delete their own files
- ✅ File type validation (whitelist)
- ✅ File size limits (5MB)
- ✅ Public read access for displaying content
- ✅ Authentication required for all upload/delete operations

## API Usage

### Upload a File

```javascript
const formData = new FormData();
formData.append('file', fileObject);
formData.append('type', 'logo'); // 'logo', 'audio', or 'video'

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
// Returns: { success: true, url: "...", path: "...", fileName: "..." }
```

### Delete a File

```javascript
const response = await fetch('/api/upload', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ filePath: 'user-id/logo/123456-image.png' }),
});

const data = await response.json();
// Returns: { success: true }
```

## Future Enhancements

Potential improvements for the future:
- Image cropping/resizing on upload
- Multiple file uploads at once
- Progress bars for large files
- Audio file uploads for task meditations
- Video uploads for community content
- File management page to view/delete all uploads
- CDN integration for faster delivery

## Troubleshooting

### Upload fails with "Failed to upload file"
- Check that the `coach-uploads` bucket exists in Supabase Storage
- Verify storage policies have been applied
- Check browser console for detailed error messages

### Logo doesn't appear after upload
- Verify the file uploaded successfully (check Supabase Storage)
- Ensure you clicked "Save" after uploading
- Check that the URL is being stored in the `coaches` table `logo_url` column

### Permission errors
- Ensure the user is logged in as a coach
- Verify the coach record exists in the database
- Check that RLS policies are configured correctly

