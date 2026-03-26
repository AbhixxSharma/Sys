#!/bin/bash

# Custom Application Health Check Script
# This script can be extended to check specific application services

echo "===================="
echo "Custom Health Checks"
echo "===================="
echo ""

# Check if specific ports are listening
check_port() {
    local port=$1
    local service_name=$2
    
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "✅ $service_name (Port $port): Running"
        return 0
    else
        echo "❌ $service_name (Port $port): Not Running"
        return 1
    fi
}

# Check MongoDB
check_port 27017 "MongoDB"

# Check Express API
check_port 3000 "Express API"

# Check disk space
echo ""
echo "Disk Space Check:"
df -h | grep -E '^/dev/' | awk '{
    if ($5+0 > 90) {
        print "❌ " $1 " is " $5 " full - CRITICAL"
    } else if ($5+0 > 80) {
        print "⚠️  " $1 " is " $5 " full - WARNING"
    } else {
        print "✅ " $1 " is " $5 " full - OK"
    }
}'

# Check system load
echo ""
echo "System Load:"
uptime | awk '{
    load = $(NF-2)
    gsub(/,/, "", load)
    if (load+0 > 2.0) {
        print "⚠️  Load Average: " load " - HIGH"
    } else {
        print "✅ Load Average: " load " - OK"
    }
}'

# Check memory
echo ""
echo "Memory Usage:"
free -m | awk 'NR==2{
    used_percent = ($3/$2) * 100
    if (used_percent > 90) {
        printf "❌ Memory: %.0f%% used - CRITICAL\n", used_percent
    } else if (used_percent > 80) {
        printf "⚠️  Memory: %.0f%% used - WARNING\n", used_percent
    } else {
        printf "✅ Memory: %.0f%% used - OK\n", used_percent
    }
}'

echo ""
echo "===================="
echo "Health Check Complete"
echo "===================="
