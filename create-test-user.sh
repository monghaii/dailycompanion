#!/bin/bash

# Script to create a test user linked to a coach
# Usage: ./create-test-user.sh <email> <coach-slug>
#
# Example: ./create-test-user.sh testuser@example.com brain-peace

set -e  # Exit on error

# Check for required arguments
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <email> <coach-slug>"
    echo ""
    echo "Parameters:"
    echo "  email       - Email address for the test user"
    echo "  coach-slug  - The URL slug of the coach to assign this user to"
    echo ""
    echo "Example:"
    echo "  $0 testuser@example.com brain-peace"
    exit 1
fi

EMAIL=$1
COACH_SLUG=$2

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env"
    exit 1
fi

# Generate random 16-character password
PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c16)

echo "========================================="
echo "Creating test user..."
echo "========================================="
echo "Email: $EMAIL"
echo "Coach Slug: $COACH_SLUG"
echo ""

# Step 1: Look up coach by slug to get coach_id
echo "Looking up coach..."
COACH_DATA=$(curl -s -X GET "$SUPABASE_URL/rest/v1/coaches?slug=eq.$COACH_SLUG&select=id,business_name" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

# Check if coach exists
if [ "$(echo $COACH_DATA | jq '. | length')" -eq 0 ]; then
    echo "Error: Coach with slug '$COACH_SLUG' not found"
    echo ""
    echo "Available coaches:"
    curl -s -X GET "$SUPABASE_URL/rest/v1/coaches?select=slug,business_name" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq -r '.[] | "  \(.slug) - \(.business_name)"'
    exit 1
fi

COACH_ID=$(echo $COACH_DATA | jq -r '.[0].id')
BUSINESS_NAME=$(echo $COACH_DATA | jq -r '.[0].business_name')

echo "✓ Found coach: $BUSINESS_NAME (ID: $COACH_ID)"
echo ""

# Step 2: Check if user already exists
echo "Checking if user exists..."
EXISTING_USER=$(curl -s -X GET "$SUPABASE_URL/rest/v1/profiles?email=eq.$EMAIL&select=id" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

if [ "$(echo $EXISTING_USER | jq '. | length')" -gt 0 ]; then
    echo "Error: User with email '$EMAIL' already exists"
    exit 1
fi

echo "✓ Email is available"
echo ""

# Step 3: Create user in Supabase Auth
echo "Creating user account..."
AUTH_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"email_confirm\": true
  }")

# Check for auth errors
AUTH_ERROR=$(echo $AUTH_RESPONSE | jq -r '.error // empty')
if [ ! -z "$AUTH_ERROR" ]; then
    echo "Error creating auth user: $AUTH_ERROR"
    echo "Full response: $AUTH_RESPONSE"
    exit 1
fi

USER_ID=$(echo $AUTH_RESPONSE | jq -r '.id')
echo "✓ Auth user created (ID: $USER_ID)"
echo ""

# Step 4: Create profile with coach link
echo "Creating user profile..."
PROFILE_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/profiles" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"id\": \"$USER_ID\",
    \"email\": \"$EMAIL\",
    \"full_name\": \"Test User\",
    \"role\": \"user\",
    \"coach_id\": \"$COACH_ID\"
  }")

# Check for profile errors (check if response is an error object, not an array)
PROFILE_ERROR=$(echo $PROFILE_RESPONSE | jq -r 'if type == "object" and .message then .message else empty end')
if [ ! -z "$PROFILE_ERROR" ]; then
    echo "Error creating profile: $PROFILE_ERROR"
    echo "Attempting to clean up auth user..."
    curl -s -X DELETE "$SUPABASE_URL/auth/v1/admin/users/$USER_ID" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Verify profile was created (response should be an array with 1 item)
if [ "$(echo $PROFILE_RESPONSE | jq 'if type == "array" then length else 0 end')" -eq 0 ]; then
    echo "Error: Profile creation returned unexpected response"
    echo "Response: $PROFILE_RESPONSE"
    echo "Attempting to clean up auth user..."
    curl -s -X DELETE "$SUPABASE_URL/auth/v1/admin/users/$USER_ID" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "✓ Profile created and linked to coach"
echo ""

# Success!
echo "========================================="
echo "✓ Test user created successfully!"
echo "========================================="
echo ""
echo "Login Credentials:"
echo "  Email:    $EMAIL"
echo "  Password: $PASSWORD"
echo "  Coach:    $BUSINESS_NAME ($COACH_SLUG)"
echo ""
echo "You can now login at: http://localhost:3000/login"
echo ""
echo "⚠️  Save these credentials - the password cannot be retrieved later!"
echo "========================================="
