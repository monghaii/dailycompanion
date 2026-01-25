#!/bin/bash

# Coach Subscription Manager - Bash Script
# Usage: ./manage-coach.sh

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

# Function to make Supabase API calls
supabase_query() {
    local query="$1"
    curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"${query}\"}"
}

# Function to update coach status
update_coach() {
    local slug="$1"
    local status="$2"
    local is_active="$3"
    
    curl -s -X PATCH "${SUPABASE_URL}/rest/v1/coaches?slug=eq.${slug}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "{\"platform_subscription_status\": \"${status}\", \"is_active\": ${is_active}, \"setup_fee_paid\": ${is_active}, \"setup_fee_paid_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"setup_fee_amount_cents\": 50000}"
}

# Function to get coach info
get_coach() {
    local slug="$1"
    curl -s -X GET "${SUPABASE_URL}/rest/v1/coaches?slug=eq.${slug}&select=*,profiles:profile_id(email,full_name)" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
}

# Function to list all coaches
list_coaches() {
    echo -e "${BLUE}📋 Fetching all coaches...${NC}\n"
    
    local response=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/coaches?select=slug,business_name,platform_subscription_status,is_active,profiles:profile_id(email)&order=created_at.desc" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")
    
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    printf "%-20s %-25s %-15s %s\n" "SLUG" "BUSINESS NAME" "STATUS" "EMAIL"
    echo -e "${BLUE}────────────────────────────────────────────────────────────────────────────────${NC}"
    
    echo "$response" | jq -r '.[] | "\(.slug)|\(.business_name)|\(.platform_subscription_status)|\(.is_active)|\(.profiles.email)"' | while IFS='|' read -r slug name status active email; do
        if [ "$active" = "true" ]; then
            status_icon="✅"
        else
            status_icon="❌"
        fi
        printf "%-20s %-25s ${GREEN}%-15s${NC} %s\n" "$slug" "$name" "$status_icon $status" "$email"
    done
    
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}\n"
}

# Function to activate coach
activate_coach() {
    local slug="$1"
    
    echo -e "${YELLOW}🔄 Activating coach: ${slug}...${NC}"
    
    local response=$(update_coach "$slug" "active" "true")
    
    if echo "$response" | jq -e '.[0].slug' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Coach subscription ACTIVATED${NC}"
        echo "$response" | jq -r '.[0] | "   Coach: \(.business_name)\n   Slug: \(.slug)\n   Status: active\n   Setup Fee: marked as paid"'
    else
        echo -e "${RED}❌ Coach not found or error occurred${NC}"
        echo "$response" | jq '.'
    fi
}

# Function to deactivate coach
deactivate_coach() {
    local slug="$1"
    
    echo -e "${YELLOW}🔄 Deactivating coach: ${slug}...${NC}"
    
    curl -s -X PATCH "${SUPABASE_URL}/rest/v1/coaches?slug=eq.${slug}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d '{"platform_subscription_status": "inactive", "is_active": false}' | jq -e '.[0].slug' > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Coach subscription DEACTIVATED${NC}"
        echo "   Slug: ${slug}"
        echo "   Status: inactive"
    else
        echo -e "${RED}❌ Coach not found or error occurred${NC}"
    fi
}

# Function to show coach status
show_status() {
    local slug="$1"
    
    echo -e "${YELLOW}🔍 Fetching coach status: ${slug}...${NC}\n"
    
    local response=$(get_coach "$slug")
    
    if echo "$response" | jq -e '.[0].slug' > /dev/null 2>&1; then
        echo -e "${BLUE}📊 Coach Subscription Status${NC}"
        echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
        echo "$response" | jq -r '.[0] | 
            "Business Name: \(.business_name)",
            "Slug: \(.slug)",
            "Email: \(.profiles.email)",
            "Full Name: \(.profiles.full_name // "N/A")",
            "──────────────────────────────────────────────────────",
            "Subscription Status: \(.platform_subscription_status)",
            "Is Active: \(if .is_active then "✅" else "❌" end)",
            "Setup Fee Paid: \(if .setup_fee_paid then "✅" else "❌" end)",
            "Stripe Customer ID: \(.stripe_customer_id // "N/A")",
            "Stripe Subscription ID: \(.platform_subscription_id // "N/A")",
            "Stripe Connect Status: \(.stripe_account_status // "N/A")"'
        echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
    else
        echo -e "${RED}❌ Coach not found${NC}"
    fi
}

# Main interactive menu
main_menu() {
    clear
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     Coach Subscription Manager (Dev Tool)         ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}\n"
    
    echo "What would you like to do?"
    echo ""
    echo "  1) List all coaches"
    echo "  2) Activate a coach (promote)"
    echo "  3) Deactivate a coach (demote)"
    echo "  4) Check coach status"
    echo "  5) Exit"
    echo ""
    read -p "Choose an option (1-5): " choice
    
    case $choice in
        1)
            clear
            list_coaches
            read -p "Press Enter to continue..."
            main_menu
            ;;
        2)
            clear
            read -p "Enter coach slug: " slug
            activate_coach "$slug"
            echo ""
            read -p "Press Enter to continue..."
            main_menu
            ;;
        3)
            clear
            read -p "Enter coach slug: " slug
            deactivate_coach "$slug"
            echo ""
            read -p "Press Enter to continue..."
            main_menu
            ;;
        4)
            clear
            read -p "Enter coach slug: " slug
            show_status "$slug"
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
    slug="$2"
    
    case $action in
        list|ls)
            list_coaches
            ;;
        activate|promote)
            if [ -z "$slug" ]; then
                echo -e "${RED}❌ Error: Slug required${NC}"
                echo "Usage: $0 activate <slug>"
                exit 1
            fi
            activate_coach "$slug"
            ;;
        deactivate|demote)
            if [ -z "$slug" ]; then
                echo -e "${RED}❌ Error: Slug required${NC}"
                echo "Usage: $0 deactivate <slug>"
                exit 1
            fi
            deactivate_coach "$slug"
            ;;
        status|show|info)
            if [ -z "$slug" ]; then
                echo -e "${RED}❌ Error: Slug required${NC}"
                echo "Usage: $0 status <slug>"
                exit 1
            fi
            show_status "$slug"
            ;;
        help|--help|-h)
            echo "Usage: $0 [action] [slug]"
            echo ""
            echo "Actions:"
            echo "  list, ls                - List all coaches"
            echo "  activate <slug>         - Activate a coach"
            echo "  deactivate <slug>       - Deactivate a coach"
            echo "  status <slug>           - Show coach status"
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
