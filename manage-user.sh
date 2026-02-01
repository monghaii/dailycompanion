#!/bin/bash

# User Subscription Manager - Bash Script
# Usage: ./manage-user.sh

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env${NC}"
    exit 1
fi

# Function to list all subscriptions
list_subscriptions() {
    echo -e "${BLUE}📋 Fetching all user subscriptions...${NC}\n"
    
    local response=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/user_subscriptions?select=*,profiles:user_id(email,full_name),coaches:coach_id(business_name,slug)&order=created_at.desc" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")
    
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    printf "%-30s %-20s %-15s %s\n" "EMAIL" "COACH" "STATUS" "CREATED"
    echo -e "${BLUE}────────────────────────────────────────────────────────────────────────────────${NC}"
    
    echo "$response" | jq -r '.[] | "\(.profiles.email)|\(.coaches.business_name)|\(.status)|\(.created_at)"' | while IFS='|' read -r email coach status created; do
        if [ "$status" = "active" ]; then
            status_display="${GREEN}✅ active${NC}"
        else
            status_display="${RED}❌ $status${NC}"
        fi
        created_date=$(echo $created | cut -d'T' -f1)
        printf "%-30s %-20s %-25s %s\n" "$email" "$coach" "$status_display" "$created_date"
    done
    
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}\n"
}

# Function to promote user (activate subscription)
promote_user() {
    local email="$1"
    local coach_slug="$2"
    
    echo -e "${YELLOW}🔄 Promoting user: ${email}...${NC}"
    
    # Get user profile
    local user_response=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/profiles?email=eq.${email}&select=*" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")
    
    local user_id=$(echo "$user_response" | jq -r '.[0].id')
    
    if [ -z "$user_id" ] || [ "$user_id" = "null" ]; then
        echo -e "${RED}❌ User not found with email: ${email}${NC}"
        return
    fi
    
    # Get coach by slug
    local coach_response=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/coaches?slug=eq.${coach_slug}&select=id,business_name,slug" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")
    
    local coach_id=$(echo "$coach_response" | jq -r '.[0].id')
    local coach_name=$(echo "$coach_response" | jq -r '.[0].business_name')
    
    if [ -z "$coach_id" ] || [ "$coach_id" = "null" ]; then
        echo -e "${RED}❌ Coach not found with slug: ${coach_slug}${NC}"
        return
    fi
    
    # Upsert subscription
    local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local next_month=$(date -u -v+1m +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "+1 month" +"%Y-%m-%dT%H:%M:%SZ")
    
    curl -s -X POST "${SUPABASE_URL}/rest/v1/user_subscriptions" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation,resolution=merge-duplicates" \
        -d "{
            \"user_id\": \"${user_id}\",
            \"coach_id\": \"${coach_id}\",
            \"status\": \"active\",
            \"current_period_start\": \"${now}\",
            \"current_period_end\": \"${next_month}\"
        }" > /dev/null
    
    echo -e "${GREEN}✅ User subscription ACTIVATED${NC}"
    echo "   Email: ${email}"
    echo "   Coach: ${coach_name}"
    echo "   Status: active"
}

# Function to demote user (deactivate subscription)
demote_user() {
    local email="$1"
    
    echo -e "${YELLOW}🔄 Demoting user: ${email}...${NC}"
    
    # Get user profile
    local user_response=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/profiles?email=eq.${email}&select=*" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")
    
    local user_id=$(echo "$user_response" | jq -r '.[0].id')
    
    if [ -z "$user_id" ] || [ "$user_id" = "null" ]; then
        echo -e "${RED}❌ User not found with email: ${email}${NC}"
        return
    fi
    
    # Update all subscriptions for this user to canceled
    curl -s -X PATCH "${SUPABASE_URL}/rest/v1/user_subscriptions?user_id=eq.${user_id}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "{\"status\": \"canceled\", \"canceled_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" > /dev/null
    
    echo -e "${GREEN}✅ User subscription DEACTIVATED${NC}"
    echo "   Email: ${email}"
    echo "   Status: canceled"
}

# Function to show user status
show_status() {
    local email="$1"
    
    echo -e "${YELLOW}🔍 Fetching user status: ${email}...${NC}\n"
    
    # Get user profile
    local user_response=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/profiles?email=eq.${email}&select=*" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")
    
    local user_id=$(echo "$user_response" | jq -r '.[0].id')
    local full_name=$(echo "$user_response" | jq -r '.[0].full_name')
    
    if [ -z "$user_id" ] || [ "$user_id" = "null" ]; then
        echo -e "${RED}❌ User not found${NC}"
        return
    fi
    
    # Get subscriptions
    local sub_response=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/user_subscriptions?user_id=eq.${user_id}&select=*,coaches:coach_id(business_name,slug)" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")
    
    echo -e "${BLUE}📊 User Subscription Status${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
    echo "Email: ${email}"
    echo "Full Name: ${full_name}"
    echo "User ID: ${user_id}"
    echo -e "${BLUE}──────────────────────────────────────────────────────${NC}"
    
    local sub_count=$(echo "$sub_response" | jq '. | length')
    
    if [ "$sub_count" -eq 0 ]; then
        echo -e "${YELLOW}No subscriptions (FREE user)${NC}"
    else
        echo "Subscriptions:"
        echo "$sub_response" | jq -r '.[] | "  • Coach: \(.coaches.business_name) (\(.coaches.slug))\n    Status: \(.status)\n    Created: \(.created_at)\n    Stripe Sub ID: \(.stripe_subscription_id // "N/A")"'
    fi
    echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
}

# Main interactive menu
main_menu() {
    clear
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    User Subscription Manager (Dev Tool)           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}\n"
    
    echo "What would you like to do?"
    echo ""
    echo "  1) List all user subscriptions"
    echo "  2) Promote user (activate premium)"
    echo "  3) Demote user (cancel premium)"
    echo "  4) Check user status"
    echo "  5) Exit"
    echo ""
    read -p "Choose an option (1-5): " choice
    
    case $choice in
        1)
            clear
            list_subscriptions
            read -p "Press Enter to continue..."
            main_menu
            ;;
        2)
            clear
            read -p "Enter user email: " email
            read -p "Enter coach slug: " slug
            promote_user "$email" "$slug"
            echo ""
            read -p "Press Enter to continue..."
            main_menu
            ;;
        3)
            clear
            read -p "Enter user email: " email
            demote_user "$email"
            echo ""
            read -p "Press Enter to continue..."
            main_menu
            ;;
        4)
            clear
            read -p "Enter user email: " email
            show_status "$email"
            echo ""
            read -p "Press Enter to continue..."
            main_menu
            ;;
        5)
            echo -e "${GREEN}👋 Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            sleep 1
            main_menu
            ;;
    esac
}

# Check if arguments provided (command-line mode)
if [ $# -eq 0 ]; then
    # No arguments - run interactive menu
    main_menu
else
    # Command-line mode
    action="$1"
    email="$2"
    coach_slug="$3"
    
    case $action in
        list|ls)
            list_subscriptions
            ;;
        promote|activate)
            if [ -z "$email" ] || [ -z "$coach_slug" ]; then
                echo -e "${RED}❌ Error: Email and coach slug required${NC}"
                echo "Usage: $0 promote <email> <coach-slug>"
                exit 1
            fi
            promote_user "$email" "$coach_slug"
            ;;
        demote|deactivate|cancel)
            if [ -z "$email" ]; then
                echo -e "${RED}❌ Error: Email required${NC}"
                echo "Usage: $0 demote <email>"
                exit 1
            fi
            demote_user "$email"
            ;;
        status|show|info)
            if [ -z "$email" ]; then
                echo -e "${RED}❌ Error: Email required${NC}"
                echo "Usage: $0 status <email>"
                exit 1
            fi
            show_status "$email"
            ;;
        help|--help|-h)
            echo "Usage: $0 [action] [email] [coach-slug]"
            echo ""
            echo "Actions:"
            echo "  list                          - List all user subscriptions"
            echo "  promote <email> <coach-slug>  - Activate user subscription"
            echo "  demote <email>                - Cancel user subscription"
            echo "  status <email>                - Show user status"
            echo ""
            echo "Examples:"
            echo "  $0 list"
            echo "  $0 promote user@example.com twinleaf"
            echo "  $0 status user@example.com"
            echo "  $0 demote user@example.com"
            echo ""
            echo "Run without arguments for interactive mode"
            ;;
        *)
            echo -e "${RED}❌ Unknown action: $action${NC}"
            echo "Run '$0 help' for usage"
            exit 1
            ;;
    esac
fi
