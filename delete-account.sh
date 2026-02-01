#!/bin/bash

# Account Deletion Utility
# DANGER: This permanently deletes accounts and all associated data
# Usage: ./delete-account.sh

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env${NC}"
    exit 1
fi

# Function to get user profile by email
get_user_profile() {
    local email="$1"
    curl -s -X GET "${SUPABASE_URL}/rest/v1/profiles?email=eq.${email}&select=*" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
}

# Function to get coach by profile_id
get_coach() {
    local profile_id="$1"
    curl -s -X GET "${SUPABASE_URL}/rest/v1/coaches?profile_id=eq.${profile_id}&select=*" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
}

# Function to delete account
delete_account() {
    local email="$1"
    
    echo -e "${YELLOW}🔍 Looking up account: ${email}...${NC}\n"
    
    # Get user profile
    local user_response=$(get_user_profile "$email")
    local user_id=$(echo "$user_response" | jq -r '.[0].id')
    local full_name=$(echo "$user_response" | jq -r '.[0].full_name')
    local role=$(echo "$user_response" | jq -r '.[0].role')
    
    # Check if profile exists
    if [ -z "$user_id" ] || [ "$user_id" = "null" ]; then
        # No profile found - check if orphaned auth user exists
        echo -e "${YELLOW}No profile found. Checking for orphaned auth user...${NC}\n"
        
        local auth_user_data=$(curl -s -X GET "${SUPABASE_URL}/auth/v1/admin/users" \
            -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
            | jq -r ".users[] | select(.email == \"${email}\")")
        
        if [ -z "$auth_user_data" ]; then
            echo -e "${RED}❌ Account not found with email: ${email}${NC}"
            return
        fi
        
        user_id=$(echo "$auth_user_data" | jq -r '.id')
        local created_at=$(echo "$auth_user_data" | jq -r '.created_at')
        
        echo -e "${YELLOW}Found orphaned auth user:${NC}"
        echo "  Email: ${email}"
        echo "  ID: ${user_id}"
        echo "  Created: ${created_at}"
        echo ""
        
        echo -e "${YELLOW}🗑️  Deleting orphaned auth user...${NC}\n"
        
        curl -s -X DELETE "${SUPABASE_URL}/auth/v1/admin/users/${user_id}" \
            -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null
        
        echo -e "${GREEN}✅ Orphaned auth user deleted${NC}"
        echo "   Email: ${email}"
        return
    fi
    
    # Profile exists - check if user is a coach
    local coach_response=$(get_coach "$user_id")
    local coach_id=$(echo "$coach_response" | jq -r '.[0].id')
    local business_name=$(echo "$coach_response" | jq -r '.[0].business_name')
    local is_coach=false
    
    if [ -n "$coach_id" ] && [ "$coach_id" != "null" ]; then
        is_coach=true
    fi
    
    # Display account info
    echo -e "${YELLOW}Found account:${NC}"
    echo "  Email: ${email}"
    echo "  Name: ${full_name}"
    echo "  Role: ${role}"
    if [ "$is_coach" = true ]; then
        echo "  Coach: ${business_name}"
    fi
    echo "  User ID: ${user_id}"
    echo ""
    
    echo -e "${YELLOW}🗑️  Deleting account and all data...${NC}\n"
    
    # Delete in order (respecting foreign key constraints)
    
    if [ "$is_coach" = true ]; then
        echo -e "${BLUE}→${NC} Deleting custom domains..."
        curl -s -X DELETE "${SUPABASE_URL}/rest/v1/custom_domains?coach_id=eq.${coach_id}" \
            -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null
        
        echo -e "${BLUE}→${NC} Deleting user subscriptions to this coach..."
        curl -s -X DELETE "${SUPABASE_URL}/rest/v1/user_subscriptions?coach_id=eq.${coach_id}" \
            -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null
        
        echo -e "${BLUE}→${NC} Deleting coach profile..."
        curl -s -X DELETE "${SUPABASE_URL}/rest/v1/coaches?id=eq.${coach_id}" \
            -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null
    fi
    
    # Delete user data
    echo -e "${BLUE}→${NC} Deleting user subscriptions..."
    curl -s -X DELETE "${SUPABASE_URL}/rest/v1/user_subscriptions?user_id=eq.${user_id}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null
    
    echo -e "${BLUE}→${NC} Deleting focus entries..."
    curl -s -X DELETE "${SUPABASE_URL}/rest/v1/focus_entries?user_id=eq.${user_id}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null
    
    echo -e "${BLUE}→${NC} Deleting emotional state entries..."
    curl -s -X DELETE "${SUPABASE_URL}/rest/v1/emotional_state_entries?user_id=eq.${user_id}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null
    
    echo -e "${BLUE}→${NC} Deleting mindfulness entries..."
    curl -s -X DELETE "${SUPABASE_URL}/rest/v1/mindfulness_entries?user_id=eq.${user_id}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null
    
    echo -e "${BLUE}→${NC} Deleting sessions..."
    curl -s -X DELETE "${SUPABASE_URL}/rest/v1/sessions?user_id=eq.${user_id}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null
    
    # Delete the profile
    echo -e "${BLUE}→${NC} Deleting profile..."
    curl -s -X DELETE "${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null
    
    # Finally, delete from auth.users
    echo -e "${BLUE}→${NC} Deleting auth user..."
    curl -s -X DELETE "${SUPABASE_URL}/auth/v1/admin/users/${user_id}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null
    
    echo -e "\n${GREEN}✅ Account deleted successfully${NC}"
    echo "   Email: ${email}"
    if [ "$is_coach" = true ]; then
        echo "   Coach: ${business_name}"
    fi
    echo "   All associated data has been removed."
}

# Function to list all accounts
list_accounts() {
    echo -e "${BLUE}📋 Fetching all accounts...${NC}\n"
    
    local response=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/profiles?select=email,full_name,role,created_at&order=created_at.desc" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")
    
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    printf "%-35s %-25s %-10s %s\n" "EMAIL" "NAME" "ROLE" "CREATED"
    echo -e "${BLUE}────────────────────────────────────────────────────────────────────────────────${NC}"
    
    echo "$response" | jq -r '.[] | "\(.email)|\(.full_name)|\(.role)|\(.created_at)"' | while IFS='|' read -r email name role created; do
        if [ "$role" = "coach" ]; then
            role_display="${MAGENTA}👨‍💼 coach${NC}"
        else
            role_display="${GREEN}👤 user${NC}"
        fi
        created_date=$(echo $created | cut -d'T' -f1)
        printf "%-35s %-25s %-20s %s\n" "$email" "$name" "$role_display" "$created_date"
    done
    
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}\n"
}

# Check if arguments provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Usage: $0 [action] [email]${NC}"
    echo ""
    echo "Actions:"
    echo "  list                - List all accounts"
    echo "  delete <email>      - Delete an account (including orphaned auth users)"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 delete user@example.com"
    exit 1
fi

# Command-line mode
action="$1"
email="$2"

case $action in
    list|ls)
        list_accounts
        ;;
    delete|remove|rm)
        if [ -z "$email" ]; then
            echo -e "${RED}❌ Error: Email required${NC}"
            echo "Usage: $0 delete <email>"
            exit 1
        fi
        delete_account "$email"
        ;;
    help|--help|-h)
        echo "Usage: $0 [action] [email]"
        echo ""
        echo "Actions:"
        echo "  list                - List all accounts"
        echo "  delete <email>      - Delete an account (including orphaned auth users)"
        echo ""
        echo "Examples:"
        echo "  $0 list"
        echo "  $0 delete user@example.com"
        echo ""
        echo -e "${YELLOW}Note: Deletion is immediate with no confirmation.${NC}"
        ;;
    *)
        echo -e "${RED}❌ Unknown action: $action${NC}"
        echo "Run '$0 help' for usage"
        exit 1
        ;;
esac
