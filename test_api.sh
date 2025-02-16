#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Symbols
CHECK_MARK="✓"
CROSS_MARK="✗"
INFO_MARK="ℹ"
WARNING_MARK="⚠"

# Function to print section header
print_header() {
    echo -e "\n${BOLD}${BLUE}=== $1 ===${NC}\n"
}

# Function to print test result
print_test_result() {
    local name="$1"
    local success="$2"
    local details="$3"
    
    if [ "$success" = true ]; then
        echo -e "${GREEN}${CHECK_MARK} ${name}${NC}"
    else
        echo -e "${RED}${CROSS_MARK} ${name}${NC}"
    fi
    
    if [ ! -z "$details" ]; then
        echo -e "   ${CYAN}${details}${NC}"
    fi
}

# Function to print info message
print_info() {
    echo -e "${BLUE}${INFO_MARK} $1${NC}"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}${WARNING_MARK} $1${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    nc -z localhost $port >/dev/null 2>&1
    return $?
}

# Function to find the Next.js server port
find_nextjs_port() {
    local default_ports=(3000 3001 3002)
    
    for port in "${default_ports[@]}"; do
        if check_port $port; then
            echo "$port"
            return 0
        fi
    done
    
    return 1
}

# Print start banner
echo -e "\n${BOLD}${BLUE}🚀 API Testing Suite${NC}"
echo -e "${CYAN}$(date '+%Y-%m-%d %H:%M:%S')${NC}\n"

# Find the active port
print_info "Checking for Next.js server..."
PORT=$(find_nextjs_port)
if [ $? -ne 0 ]; then
    print_warning "No Next.js server found running on ports 3000, 3001, or 3002"
    print_warning "Please start the Next.js server first"
    exit 1
fi

print_info "Found server running on port ${GREEN}${PORT}${NC}"
print_info "Using base URL: ${GREEN}http://localhost:${PORT}/api${NC}\n"

# Set the base URL for all API calls
BASE_URL="http://localhost:${PORT}/api"

# Initialize counters
total_tests=0
successful_tests=0
failed_tests=0

# Function to make a GET request
make_get_request() {
    local endpoint="$1"
    local response
    response=$(curl -s -H "Accept: application/json" "${BASE_URL}${endpoint}")
    local success=$(echo "$response" | jq -r '.success // false')
    
    if [ "$success" = "true" ]; then
        print_test_result "GET ${endpoint}" true
        ((successful_tests++))
    else
        print_test_result "GET ${endpoint}" false "$(echo "$response" | jq -r '.error // "Unknown error"')"
        ((failed_tests++))
    fi
    ((total_tests++))
    
    echo -e "\n${CYAN}Response:${NC}"
    echo "$response" | jq '.' | sed 's/^/   /'
    echo -e "\n${CYAN}----------------------------------------${NC}"
}

# Function to make a POST request
make_post_request() {
    local endpoint="$1"
    local data="$2"
    local response
    response=$(curl -s -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d "$data" "${BASE_URL}${endpoint}")
    local success=$(echo "$response" | jq -r '.success // false')
    
    if [ "$success" = "true" ]; then
        print_test_result "POST ${endpoint}" true
        ((successful_tests++))
    else
        print_test_result "POST ${endpoint}" false "$(echo "$response" | jq -r '.error // "Unknown error"')"
        ((failed_tests++))
    fi
    ((total_tests++))
    
    echo -e "\n${CYAN}Request Body:${NC}"
    echo "$data" | jq '.' | sed 's/^/   /'
    echo -e "\n${CYAN}Response:${NC}"
    echo "$response" | jq '.' | sed 's/^/   /'
    echo -e "\n${CYAN}----------------------------------------${NC}"
}

# Function to make a DELETE request
make_delete_request() {
    local endpoint="$1"
    local response
    response=$(curl -s -X DELETE -H "Accept: application/json" "${BASE_URL}${endpoint}")
    
    if [ "$(echo "$response" | grep -c "successfully")" -gt 0 ]; then
        print_test_result "DELETE ${endpoint}" true
        ((successful_tests++))
    else
        print_test_result "DELETE ${endpoint}" false "$(echo "$response")"
        ((failed_tests++))
    fi
    ((total_tests++))
    
    echo -e "\n${CYAN}Response:${NC}"
    echo "$response" | sed 's/^/   /'
    echo -e "\n${CYAN}----------------------------------------${NC}"
}

# Test GET endpoints
print_header "Vote Management Tests"
make_get_request "/votes?action=history"
make_get_request "/votes?action=history&limit=5"
make_get_request "/votes?action=stats"
make_get_request "/votes?action=userVotes&userId=test-user"

print_header "Database Information Tests"
make_get_request "/database-info"

# Create test user with unique ID
TIMESTAMP=$(date +%s)
TEST_USER_ID="test-user-${TIMESTAMP}"

print_header "User Management Tests"
make_post_request "/database-info" "{
    \"action\": \"add\",
    \"collectionName\": \"users\",
    \"data\": {
        \"name\": \"Test User\",
        \"userId\": \"${TEST_USER_ID}\",
        \"email\": \"test@example.com\",
        \"role\": \"user\",
        \"status\": \"active\",
        \"voteCount\": 0,
        \"votedLogos\": []
    }
}"

# Wait a bit for the user to be created
sleep 1

print_header "Vote Submission Tests"
make_post_request "/votes" "{
    \"userId\": \"${TEST_USER_ID}\",
    \"logoId\": \"1\",
    \"ownerId\": \"owner123\",
    \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\"
}"

print_header "Logo Management Tests"
make_post_request "/database-info" "{
    \"action\": \"add\",
    \"collectionName\": \"logos\",
    \"data\": {
        \"value\": \"${TIMESTAMP}\",
        \"src\": \"/logos/Logo${TIMESTAMP}.png\",
        \"alt\": \"Test logo created during API testing with timestamp ${TIMESTAMP}\",
        \"status\": \"active\"
    }
}"

make_post_request "/database-info" "{
    \"action\": \"stats\",
    \"collectionName\": \"logos\"
}"

# Store IDs for deletion tests
print_header "Cleanup Tests"
print_info "Creating test entities for deletion..."

# Create test user and store ID
USER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "{
    \"action\": \"add\",
    \"collectionName\": \"users\",
    \"data\": {
        \"name\": \"Test User for Delete\",
        \"userId\": \"test-user-delete-${TIMESTAMP}\",
        \"email\": \"test-delete@example.com\",
        \"role\": \"user\",
        \"status\": \"active\",
        \"voteCount\": 0,
        \"votedLogos\": []
    }
}" "${BASE_URL}/database-info")
USER_ID=$(echo "$USER_RESPONSE" | jq -r '.data._id')
echo -e "Created User ID: ${CYAN}${USER_ID}${NC}"

# Create test vote and store ID
VOTE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "{
    \"userId\": \"test-user-delete-${TIMESTAMP}\",
    \"logoId\": \"1\",
    \"ownerId\": \"owner123\",
    \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\"
}" "${BASE_URL}/votes")
VOTE_ID=$(echo "$VOTE_RESPONSE" | jq -r '.data._id')
echo -e "Created Vote ID: ${CYAN}${VOTE_ID}${NC}"

# Create test logo and store ID
LOGO_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "{
    \"action\": \"add\",
    \"collectionName\": \"logos\",
    \"data\": {
        \"value\": \"test-delete-${TIMESTAMP}\",
        \"src\": \"/logos/Logo-delete-${TIMESTAMP}.png\",
        \"alt\": \"Test logo for deletion with timestamp ${TIMESTAMP}\",
        \"status\": \"active\"
    }
}" "${BASE_URL}/database-info")
LOGO_ID=$(echo "$LOGO_RESPONSE" | jq -r '.data._id')
echo -e "Created Logo ID: ${CYAN}${LOGO_ID}${NC}\n"

# Test DELETE endpoints with actual IDs
print_info "Performing deletion tests..."
if [ ! -z "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
    make_delete_request "/users/${USER_ID}"
fi

if [ ! -z "$VOTE_ID" ] && [ "$VOTE_ID" != "null" ]; then
    make_delete_request "/votes/${VOTE_ID}"
fi

if [ ! -z "$LOGO_ID" ] && [ "$LOGO_ID" != "null" ]; then
    make_delete_request "/logos/${LOGO_ID}"
fi

# Print test summary
print_header "Test Summary"
echo -e "Total tests run: ${BOLD}${total_tests}${NC}"
echo -e "Successful tests: ${GREEN}${successful_tests}${NC}"
echo -e "Failed tests: ${RED}${failed_tests}${NC}"

if [ $failed_tests -eq 0 ]; then
    echo -e "\n${GREEN}${CHECK_MARK} All tests passed successfully!${NC}"
else
    echo -e "\n${RED}${CROSS_MARK} Some tests failed. Please check the output above for details.${NC}"
fi

echo # Final newline
